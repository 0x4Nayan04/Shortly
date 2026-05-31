import { useCallback, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ShareModal from './ShareModal';
import { createShortUrl, createCustomShortUrl } from '../api/shortUrl.api';
import { getApiErrorMessage, getApiPayload } from '../utils/axiosInstance';
import { rememberAnonymousLink } from '../utils/anonymousLinks';
import { buildPublicShortUrl } from '../utils/publicShortUrl';
import { validators } from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import { formAlertClass } from '../utils/designFormClasses';
import { useAnnouncement, LiveRegion } from './Accessibility';
import {
  showToast,
  useOnlineStatus,
  useCopyToClipboard
} from './UxEnhancements';
import UrlInputBar from './urlForm/UrlInputBar';
import LandingCustomAliasSection from './urlForm/LandingCustomAliasSection';
import DefaultCustomAliasSection from './urlForm/DefaultCustomAliasSection';
import UrlFormResult from './urlForm/UrlFormResult';

const UrlForm = ({ onUrlCreated, user, onShowAuth, variant = 'default' }) => {
  const isLanding = variant === 'landing';
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [createdLink, setCreatedLink] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [announcement, announce] = useAnnouncement();
  const { isOnline } = useOnlineStatus();
  const { copy, isCopied } = useCopyToClipboard();

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

  const updateField = (field, value, setter) => {
    setter(value);
    onFieldChange(
      field,
      { ...formValues, [field]: value },
      {
        clearError: () => setError('')
      }
    );
  };

  const clearCustomAliasValidation = () => {
    setFieldErrors((prev) => ({ ...prev, customAlias: null }));
    setTouched((prev) => ({ ...prev, customAlias: false }));
  };

  const handleToggleCustomAlias = () => {
    const next = !useCustomAlias;
    setUseCustomAlias(next);
    setError('');
    if (!next) {
      clearCustomAliasValidation();
    }
  };

  const handleDefaultCustomAliasChange = (e) => {
    if (!user && e.target.checked) {
      setError('Please sign in to use custom aliases');
      onShowAuth?.();
      return;
    }
    setUseCustomAlias(e.target.checked);
    setError('');
    if (!e.target.checked) {
      clearCustomAliasValidation();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    setLoading(true);
    setError('');
    setShortUrl('');
    setCreatedLink(null);
    setShareOpen(false);

    const loadingToast = showToast.loading('Creating short URL...');

    try {
      let response;

      if (useCustomAlias && customAlias) {
        if (!user) {
          showToast.dismiss(loadingToast);
          setError('Please sign in to use custom aliases');
          showToast.error('Please sign in to use custom aliases');
          return;
        }
        response = await createCustomShortUrl(url, customAlias);
      } else {
        response = await createShortUrl(url);
      }

      const payload = getApiPayload(response);
      const createdShortUrl = payload?.short_url;

      if (createdShortUrl) {
        if (payload?.id && payload?.manage_token) {
          rememberAnonymousLink({
            id: payload.id,
            manage_token: payload.manage_token,
            short_url: createdShortUrl
          });
        }

        setCreatedLink({ slug: createdShortUrl, fullUrl: url });
        setShortUrl(buildPublicShortUrl(createdShortUrl));
        showToast.dismiss(loadingToast);
        if (payload.reused) {
          showToast.success('Existing short link reused for this URL');
          announce('Existing short link reused for this URL');
        } else {
          showToast.success('URL shortened successfully!');
          announce('URL shortened successfully! Your new short URL is ready.');
        }
        onUrlCreated?.();
        setUrl('');
        setCustomAlias('');
        setUseCustomAlias(false);
        resetValidation();
      } else {
        console.error('Unexpected response structure:', response);
        showToast.dismiss(loadingToast);
        showToast.error('Failed to process the server response.');
        setError('Failed to process the server response.');
      }
    } catch (err) {
      showToast.dismiss(loadingToast);
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === 'object' && Array.isArray(data.errors)) {
        const backendErrors = {};
        data.errors.forEach((e) => {
          const fieldName =
            e.field === 'full_url'
              ? 'url'
              : e.field === 'custom_url'
                ? 'customAlias'
                : e.field;
          backendErrors[fieldName] = e.message;
        });
        mergeFieldErrors(backendErrors);
        showToast.error('Please check the form for errors.');
      } else {
        const errorMsg = getApiErrorMessage(err, 'Failed to create short URL');
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    copy(shortUrl, 'Short URL copied to clipboard!');
    announce('Short URL copied to clipboard');
  };

  const blurField = (field, value) => {
    handleBlur(field, { ...formValues, [field]: value });
  };

  const customAliasChangeHandler = (e) =>
    updateField('customAlias', e.target.value, setCustomAlias);

  const customAliasBlurHandler = (e) =>
    blurField('customAlias', e.target.value);

  return (
    <div className={isLanding ? '' : 'space-y-6'}>
      <LiveRegion
        message={announcement}
        politeness='polite'
      />

      <form
        onSubmit={handleSubmit}
        className={isLanding ? 'pt-0' : 'space-y-4'}
        aria-label='URL shortener form'>
        <UrlInputBar
          url={url}
          setUrl={setUrl}
          loading={loading}
          fieldErrors={fieldErrors}
          touched={touched}
          handleChange={updateField}
          handleBlur={blurField}
          showPrefix={isLanding}
          shortUrl={shortUrl}>
          {isLanding && (
            <LandingCustomAliasSection
              user={user}
              onShowAuth={onShowAuth}
              useCustomAlias={useCustomAlias}
              onToggleCustomAlias={handleToggleCustomAlias}
              customAlias={customAlias}
              onCustomAliasChange={customAliasChangeHandler}
              onCustomAliasBlur={customAliasBlurHandler}
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
            onCustomAliasChange={customAliasChangeHandler}
            onCustomAliasBlur={customAliasBlurHandler}
            touched={touched}
            fieldErrors={fieldErrors}
          />
        )}

        {error && (
          <div
            className={formAlertClass}
            role='alert'
            aria-live='assertive'>
            <div className='flex items-center'>
              <AlertCircle
                className='size-5 mr-2 shrink-0'
                aria-hidden='true'
              />
              {error}
            </div>
            <div className='mt-3 flex gap-2'>
              <button
                type='button'
                onClick={handleSubmit}
                className='sm-btn sm-btn-primary text-sm !bg-[#dc2626] hover:!opacity-90'>
                Retry
              </button>
            </div>
          </div>
        )}
      </form>

      {shortUrl && (
        <UrlFormResult
          shortUrl={shortUrl}
          isLanding={isLanding}
          user={user}
          onShowAuth={onShowAuth}
          isCopied={isCopied(shortUrl)}
          onCopy={copyToClipboard}
          onShare={() => setShareOpen(true)}
        />
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shortUrl={createdLink?.slug}
        fullUrl={createdLink?.fullUrl}
      />
    </div>
  );
};

export default UrlForm;
