import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useAnnouncement, useFocusTrap } from './Accessibility';
import { BrandedSpinner } from './LoadingSpinner';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFormValidation } from '../hooks/useFormValidation';
import { showToast, useOnlineStatus } from './UxEnhancements';
import { getDesignInputClass, formAlertClass } from '../utils/designFormClasses';
import { validators } from '../utils/validation';
import { mapBackendFieldErrors } from '../utils/apiErrors';
import { getApiErrorMessage } from '../utils/axiosInstance';

const EditLinkModal = ({ isOpen, onClose, link, onSave }) => {
  const [fullUrl, setFullUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { isOnline } = useOnlineStatus();
  const focusTrapRef = useFocusTrap(isOpen, {
    onEscape: onClose,
    restoreFocus: true
  });
  useBodyScrollLock(isOpen);
  const [announcement, announce] = useAnnouncement();

  const getRules = useCallback(
    () => ({
      fullUrl: validators.url,
      shortUrl: (value) => validators.customAlias(value, { required: true })
    }),
    []
  );

  const {
    fieldErrors,
    touched,
    handleBlur,
    onFieldChange,
    validateAll,
    mergeFieldErrors,
    resetValidation
  } = useFormValidation(['fullUrl', 'shortUrl'], getRules);

  useEffect(() => {
    if (isOpen && link) {
      setFullUrl(link.full_url || '');
      setShortUrl(link.short_url || '');
      setError('');
      resetValidation();
    }
  }, [isOpen, link, resetValidation]);

  if (!isOpen) return null;

  const formValues = { fullUrl, shortUrl };

  const updateField = (field, value, setter) => {
    setter(value);
    onFieldChange(
      field,
      { ...formValues, [field]: value },
      { clearError: () => setError('') }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      showToast.error("You're offline. Cannot update link.");
      return;
    }

    if (!validateAll(formValues).valid) return;

    setSaving(true);
    setError('');

    try {
      await onSave({
        full_url: fullUrl.trim(),
        short_url: shortUrl.trim()
      });
      showToast.success('Link updated');
      announce('Link updated');
      onClose();
    } catch (err) {
      const data = err?.response ? err.response.data : err;
      if (data && typeof data === 'object' && Array.isArray(data.errors)) {
        const backendErrors = mapBackendFieldErrors(data.errors, {
          full_url: 'fullUrl',
          custom_url: 'shortUrl'
        });
        mergeFieldErrors(backendErrors);
        showToast.error('Please check the form for errors.');
      } else {
        const errorMsg = getApiErrorMessage(err, 'Failed to update link');
        setError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='edit-link-modal-title'>
      <div
        className='absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />
      <div
        ref={focusTrapRef}
        className='edit-link-modal relative app-panel w-full max-w-md max-h-[90dvh] overflow-y-auto scrollbar-hide animate-scale-in p-5 sm:p-6'>
        <div className='edit-link-modal__header flex items-center justify-between pb-4 mb-5 border-b border-border'>
          <h2
            id='edit-link-modal-title'
            className='font-display text-xl font-semibold text-ink m-0 leading-none tracking-tight'>
            Edit link
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='landing-icon-btn shrink-0 size-8 rounded-full border border-border bg-surface-muted text-muted-strong hover:text-ink hover:border-primary transition-colors flex items-center justify-center'
            aria-label='Close'>
            <X
              className='size-4'
              aria-hidden='true'
            />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby='edit-link-modal-title'>
          <div className='flex flex-col gap-4'>
            <div>
              <label
                htmlFor='edit-full-url'
                className='sm-label'>
                Destination URL
              </label>
              <input
                id='edit-full-url'
                type='url'
                value={fullUrl}
                onChange={(e) => updateField('fullUrl', e.target.value, setFullUrl)}
                onBlur={() => handleBlur('fullUrl', formValues)}
                placeholder='https://example.com/your-long-link'
                className={getDesignInputClass({
                  hasError: touched.fullUrl && fieldErrors.fullUrl
                })}
                aria-invalid={
                  touched.fullUrl && fieldErrors.fullUrl ? 'true' : 'false'
                }
                aria-describedby={
                  fieldErrors.fullUrl ? 'edit-full-url-error' : undefined
                }
                autoComplete='url'
              />
              {touched.fullUrl && fieldErrors.fullUrl && (
                <p
                  id='edit-full-url-error'
                  className='sm-field-error'
                  role='alert'>
                  {fieldErrors.fullUrl}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='edit-short-url'
                className='sm-label'>
                Short alias
              </label>
              <input
                id='edit-short-url'
                type='text'
                value={shortUrl}
                onChange={(e) => updateField('shortUrl', e.target.value, setShortUrl)}
                onBlur={() => handleBlur('shortUrl', formValues)}
                placeholder='my-link'
                className={getDesignInputClass({
                  hasError: touched.shortUrl && fieldErrors.shortUrl,
                  className: 'font-mono text-sm'
                })}
                aria-invalid={
                  touched.shortUrl && fieldErrors.shortUrl ? 'true' : 'false'
                }
                aria-describedby={
                  fieldErrors.shortUrl
                    ? 'edit-short-url-error'
                    : 'edit-short-url-hint'
                }
                autoComplete='off'
              />
              {touched.shortUrl && fieldErrors.shortUrl ? (
                <p
                  id='edit-short-url-error'
                  className='sm-field-error'
                  role='alert'>
                  {fieldErrors.shortUrl}
                </p>
              ) : (
                <p
                  id='edit-short-url-hint'
                  className='hero-form-hint'>
                  3–20 chars · letters, numbers, hyphens, underscores
                </p>
              )}
            </div>

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
              </div>
            )}

            <div className='flex justify-end gap-2 pt-2'>
              <button
                type='button'
                onClick={onClose}
                disabled={saving}
                className='sm-btn sm-btn-secondary'>
                Cancel
              </button>
              <button
                type='submit'
                disabled={saving || !isOnline}
                aria-busy={saving}
                className='sm-btn sm-btn-primary'>
                {saving ? (
                  <>
                    <BrandedSpinner
                      size='sm'
                      decorative
                    />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
                <span
                  className='sr-only'
                  aria-live='polite'>
                  {saving ? 'Saving' : ''}
                </span>
              </button>
            </div>
          </div>
        </form>

        <div
          role='status'
          aria-live='polite'
          className='sr-only'>
          {announcement}
        </div>
      </div>
    </div>
  );
};

export default EditLinkModal;
