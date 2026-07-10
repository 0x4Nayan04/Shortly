import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import ShareModal from './ShareModal';
import { createShortUrl, createCustomShortUrl } from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';
import { rememberAnonymousLink } from '../utils/anonymousLinks';
import { handleApiFormError } from '../utils/apiErrors';
import { buildPublicShortUrl } from '../utils/publicShortUrl';
import { validators } from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import { formAlertClass } from '../utils/designFormClasses';

import { useAnnouncement, LiveRegion } from './Accessibility';
import { useOnlineStatus, useCopyToClipboard } from './UxEnhancements';
import { showToast } from '../utils/showToast';
import UrlInputBar from './urlForm/UrlInputBar';
import LandingCustomAliasSection from './urlForm/LandingCustomAliasSection';
import DefaultCustomAliasSection from './urlForm/DefaultCustomAliasSection';
import UrlFormResult from './urlForm/UrlFormResult';
const rememberLinkIfAnonymous = (payload) => {
  if (!payload?.id || !payload?.manage_token) return;
  rememberAnonymousLink({
    id: payload.id,
    manage_token: payload.manage_token,
    short_url: payload.short_url
  });
};

const initialState = {
  url: '',
  customAlias: '',
  shortUrl: '',
  createdLink: null,
  shareOpen: false,
  loading: false,
  error: '',
  useCustomAlias: false
};

function urlFormReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, error: '' };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.value };
    case 'TOGGLE_CUSTOM_ALIAS':
      return {
        ...state,
        useCustomAlias: !state.useCustomAlias,
        error: ''
      };
    case 'SET_USE_CUSTOM_ALIAS':
      return { ...state, useCustomAlias: action.value, error: '' };
    case 'SUBMIT_START':
      return {
        ...state,
        loading: true,
        error: '',
        shortUrl: '',
        createdLink: null,
        shareOpen: false
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...initialState,
        shortUrl: action.shortUrl,
        createdLink: action.createdLink
      };
    case 'SUBMIT_FAILURE':
      return { ...state, loading: false, error: action.error };
    case 'SET_SHARE_OPEN':
      return { ...state, shareOpen: action.value };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

const UrlForm = ({ onUrlCreated, user, onShowAuth, variant = 'default' }) => {
  const isLanding = variant === 'landing';
  const [state, dispatch] = useReducer(urlFormReducer, initialState);
  const resultRef = useRef(null);
  const {
    url,
    customAlias,
    shortUrl,
    createdLink,
    shareOpen,
    loading,
    error,
    useCustomAlias
  } = state;

  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copy, isCopied } = useCopyToClipboard();

  useEffect(() => {
    if (!shortUrl || !resultRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    resultRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center'
    });
  }, [shortUrl]);

  const getRules = useCallback(
    () => ({
      url: validators.url,
      customAlias: useCustomAlias
        ? (value) => validators.customAlias(value, { required: true })
        : () => null
    }),
    [useCustomAlias]
  );

  const {
    fieldErrors,
    touched,
    handleBlur,
    onFieldChange,
    validateAll,
    mergeFieldErrors,
    resetValidation,
    setFieldErrors,
    setTouched
  } = useFormValidation(['url', 'customAlias'], getRules);

  const formValues = { url, customAlias };
  const onCustomAliasChange = (e) => {
    const val = e.target.value;
    dispatch({ type: 'SET_FIELD', field: 'customAlias', value: val });
    onFieldChange(
      'customAlias',
      { ...formValues, customAlias: val },
      { clearError: () => dispatch({ type: 'SET_ERROR', value: '' }) }
    );
  };
  const onCustomAliasBlur = (e) =>
    handleBlur('customAlias', {
      ...formValues,
      customAlias: e.target.value
    });

  const clearCustomAliasValidation = () => {
    setFieldErrors((prev) => ({ ...prev, customAlias: null }));
    setTouched((prev) => ({ ...prev, customAlias: false }));
  };

  const handleToggleCustomAlias = () => {
    const next = !useCustomAlias;
    dispatch({ type: 'TOGGLE_CUSTOM_ALIAS' });
    if (!next) {
      clearCustomAliasValidation();
    }
  };

  const handleDefaultCustomAliasChange = (e) => {
    if (!user && e.target.checked) {
      dispatch({
        type: 'SET_ERROR',
        value: 'Please sign in to use custom aliases'
      });
      onShowAuth?.();
      return;
    }
    dispatch({ type: 'SET_USE_CUSTOM_ALIAS', value: e.target.checked });
    if (!e.target.checked) {
      clearCustomAliasValidation();
    }
  };

  const announceSuccess = (reused) => {
    if (reused) {
      showToast.success('Existing short link reused for this URL');
      announce('Existing short link reused for this URL');
      return;
    }
    showToast.success('URL shortened successfully!');
    announce('URL shortened successfully! Your new short URL is ready.');
  };

  const handleSubmitSuccess = (payload, loadingToast) => {
    const createdShortUrl = payload?.short_url;
    if (!createdShortUrl) {
      showToast.dismiss(loadingToast);
      const msg = 'Failed to process the server response.';
      dispatch({ type: 'SUBMIT_FAILURE', error: msg });
      showToast.error(msg);
      return;
    }
    rememberLinkIfAnonymous(payload);
    dispatch({
      type: 'SUBMIT_SUCCESS',
      shortUrl: buildPublicShortUrl(createdShortUrl),
      createdLink: { slug: createdShortUrl, fullUrl: url }
    });
    showToast.dismiss(loadingToast);
    announceSuccess(payload.reused);
    onUrlCreated?.();
    resetValidation();
  };

  const handleSubmitError = (err, loadingToast) => {
    showToast.dismiss(loadingToast);
    handleApiFormError(
      err,
      {
        setError: (val) => dispatch({ type: 'SET_ERROR', value: val }),
        mergeFieldErrors
      },
      {
        fallbackMessage: 'Failed to create short URL',
        fieldMap: { full_url: 'url', custom_url: 'customAlias' }
      }
    );
    dispatch({ type: 'SET_LOADING', value: false });
  };

  const createUrl = async (loadingToast) => {
    if (!useCustomAlias || !customAlias) {
      return createShortUrl(url);
    }
    if (!user) {
      showToast.dismiss(loadingToast);
      const message = 'Please sign in to use custom aliases';
      dispatch({ type: 'SET_ERROR', value: message });
      showToast.error(message);
      return null;
    }
    return createCustomShortUrl(url, customAlias);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot create URL.");
      return;
    }

    if (
      !validateAll(formValues, {
        touchFields: useCustomAlias ? ['url', 'customAlias'] : ['url']
      }).valid
    ) {
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    const loadingToast = showToast.loading('Creating short URL...');

    try {
      const response = await createUrl(loadingToast);
      if (!response) return;
      const payload = getApiPayload(response);
      handleSubmitSuccess(payload, loadingToast);
    } catch (err) {
      handleSubmitError(err, loadingToast);
    }
  };

  const copyToClipboard = () => {
    copy(shortUrl, 'Short URL copied to clipboard!');
    announce('Short URL copied to clipboard');
  };

  return (
    <div className={isLanding ? '' : 'space-y-6'}>
      <LiveRegion message={announcement} politeness="polite" />

      <form
        onSubmit={handleSubmit}
        noValidate
        className={isLanding ? 'pt-0' : 'space-y-4'}
        aria-label="URL shortener form"
      >
        <UrlInputBar
          url={url}
          setUrl={(val) =>
            dispatch({ type: 'SET_FIELD', field: 'url', value: val })
          }
          loading={loading}
          fieldErrors={fieldErrors}
          touched={touched}
          handleChange={(field, value) => {
            dispatch({ type: 'SET_FIELD', field, value });
            onFieldChange(
              field,
              { ...formValues, [field]: value },
              { clearError: () => dispatch({ type: 'SET_ERROR', value: '' }) }
            );
          }}
          handleBlur={(field, value) =>
            handleBlur(field, { ...formValues, [field]: value })
          }
          showPrefix={isLanding}
          shortUrl={shortUrl}
        >
          {isLanding && (
            <LandingCustomAliasSection
              user={user}
              onShowAuth={onShowAuth}
              useCustomAlias={useCustomAlias}
              onToggleCustomAlias={handleToggleCustomAlias}
              customAlias={customAlias}
              onCustomAliasChange={onCustomAliasChange}
              onCustomAliasBlur={onCustomAliasBlur}
              touched={touched}
              fieldErrors={fieldErrors}
            />
          )}
        </UrlInputBar>

        {!isLanding && (
          <DefaultCustomAliasSection
            user={user}
            useCustomAlias={useCustomAlias}
            onUseCustomAliasChange={handleDefaultCustomAliasChange}
            customAlias={customAlias}
            onCustomAliasChange={onCustomAliasChange}
            onCustomAliasBlur={onCustomAliasBlur}
            touched={touched}
            fieldErrors={fieldErrors}
          />
        )}

        {error && (
          <div className={formAlertClass} role="alert" aria-live="assertive">
            <div className="flex items-center">
              <AlertCircle
                className="size-5 mr-2 shrink-0"
                aria-hidden="true"
              />
              {error}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="sm-btn sm-btn-primary text-sm !bg-[#dc2626] hover:!opacity-90"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </form>

      {shortUrl && (
        <UrlFormResult
          ref={resultRef}
          shortUrl={shortUrl}
          isLanding={isLanding}
          user={user}
          onShowAuth={onShowAuth}
          isCopied={isCopied(shortUrl)}
          onCopy={copyToClipboard}
          onShare={() => dispatch({ type: 'SET_SHARE_OPEN', value: true })}
        />
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => dispatch({ type: 'SET_SHARE_OPEN', value: false })}
        shortUrl={createdLink?.slug}
        fullUrl={createdLink?.fullUrl}
      />
    </div>
  );
};

export default UrlForm;
