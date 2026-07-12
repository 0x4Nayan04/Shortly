import { useCallback, useEffect, useReducer, useRef } from 'react';
import { createCustomShortUrl, createShortUrl } from '../api/shortUrl.api';
import { getApiPayload } from '../utils/axiosInstance';
import { rememberAnonymousLink } from '../utils/anonymousLinks';
import { handleApiFormError } from '../utils/apiErrors';
import { buildPublicShortUrl } from '../utils/publicShortUrl';
import { validators } from '../utils/validation';
import { useFormValidation } from './useFormValidation';
import { useAnnouncement } from '../components/Accessibility';
import { useCopyToClipboard, useOnlineStatus } from '../components/UxEnhancements';
import { showToast } from '../utils/showToast';

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
      return { ...state, useCustomAlias: !state.useCustomAlias, error: '' };
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
    default:
      return state;
  }
}

function rememberLinkIfAnonymous(payload) {
  if (!payload?.id || !payload?.manage_token) return;
  rememberAnonymousLink({
    id: payload.id,
    manage_token: payload.manage_token,
    short_url: payload.short_url
  });
}

export function useUrlFormController({ user, onShowAuth, onUrlCreated }) {
  const [state, dispatch] = useReducer(urlFormReducer, initialState);
  const resultRef = useRef(null);
  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copy, isCopied } = useCopyToClipboard();
  const { url, customAlias, shortUrl, useCustomAlias } = state;

  useEffect(() => {
    if (!shortUrl || !resultRef.current) return;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    resultRef.current.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
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

  const validation = useFormValidation(['url', 'customAlias'], getRules);
  const formValues = { url, customAlias };

  const clearCustomAliasValidation = () => {
    validation.setFieldErrors((previous) => ({
      ...previous,
      customAlias: null
    }));
    validation.setTouched((previous) => ({
      ...previous,
      customAlias: false
    }));
  };

  const setField = (field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
    validation.onFieldChange(
      field,
      { ...formValues, [field]: value },
      { clearError: () => dispatch({ type: 'SET_ERROR', value: '' }) }
    );
  };

  const blurField = (field, value) =>
    validation.handleBlur(field, { ...formValues, [field]: value });

  const changeCustomAlias = (event) =>
    setField('customAlias', event.target.value);

  const blurCustomAlias = (event) =>
    blurField('customAlias', event.target.value);

  const toggleLandingCustomAlias = () => {
    const next = !useCustomAlias;
    dispatch({ type: 'TOGGLE_CUSTOM_ALIAS' });
    if (!next) clearCustomAliasValidation();
  };

  const changeDefaultCustomAlias = (event) => {
    if (!user && event.target.checked) {
      dispatch({
        type: 'SET_ERROR',
        value: 'Please sign in to use custom aliases'
      });
      onShowAuth?.();
      return;
    }
    dispatch({ type: 'SET_USE_CUSTOM_ALIAS', value: event.target.checked });
    if (!event.target.checked) clearCustomAliasValidation();
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
    if (!payload?.short_url) {
      showToast.dismiss(loadingToast);
      const message = 'Failed to process the server response.';
      dispatch({ type: 'SUBMIT_FAILURE', error: message });
      showToast.error(message);
      return;
    }
    rememberLinkIfAnonymous(payload);
    dispatch({
      type: 'SUBMIT_SUCCESS',
      shortUrl: buildPublicShortUrl(payload.short_url),
      createdLink: {
        id: payload.id,
        slug: payload.short_url,
        fullUrl: url,
        manageToken: payload.manage_token
      }
    });
    showToast.dismiss(loadingToast);
    announceSuccess(payload.reused);
    onUrlCreated?.();
    validation.resetValidation();
  };

  const createUrl = async (loadingToast) => {
    if (!useCustomAlias || !customAlias) return createShortUrl(url);
    if (user) return createCustomShortUrl(url, customAlias);

    showToast.dismiss(loadingToast);
    const message = 'Please sign in to use custom aliases';
    dispatch({ type: 'SET_ERROR', value: message });
    dispatch({ type: 'SET_LOADING', value: false });
    showToast.error(message);
    return null;
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (!isOnline) {
      showToast.error("You're offline. Cannot create URL.");
      return;
    }
    if (
      !validation.validateAll(formValues, {
        touchFields: useCustomAlias ? ['url', 'customAlias'] : ['url']
      }).valid
    ) {
      return;
    }

    dispatch({ type: 'SUBMIT_START' });
    const loadingToast = showToast.loading('Creating short URL...');
    try {
      const response = await createUrl(loadingToast);
      if (response) handleSubmitSuccess(getApiPayload(response), loadingToast);
    } catch (error) {
      showToast.dismiss(loadingToast);
      handleApiFormError(
        error,
        {
          setError: (value) => dispatch({ type: 'SET_ERROR', value }),
          mergeFieldErrors: validation.mergeFieldErrors
        },
        {
          fallbackMessage: 'Failed to create short URL',
          fieldMap: { full_url: 'url', custom_url: 'customAlias' }
        }
      );
      dispatch({ type: 'SET_LOADING', value: false });
    }
  };

  const copyShortUrl = () => {
    copy(shortUrl, 'Short URL copied to clipboard!');
    announce('Short URL copied to clipboard');
  };

  return {
    state,
    validation,
    announcement,
    resultRef,
    setField,
    blurField,
    changeCustomAlias,
    blurCustomAlias,
    toggleLandingCustomAlias,
    changeDefaultCustomAlias,
    submit,
    copyShortUrl,
    isShortUrlCopied: isCopied(shortUrl),
    openShare: () => dispatch({ type: 'SET_SHARE_OPEN', value: true }),
    closeShare: () => dispatch({ type: 'SET_SHARE_OPEN', value: false })
  };
}
