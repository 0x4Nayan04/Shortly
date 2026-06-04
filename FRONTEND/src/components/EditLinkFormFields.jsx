import { useCallback, useState } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import { validators } from '../utils/validation';
import { handleApiFormError } from '../utils/apiErrors';
import { showToast } from '../utils/showToast';
import FormField from './forms/FormField';
import FormAlert from './forms/FormAlert';
import EditLinkShortAliasField from './EditLinkShortAliasField';
import { BrandedSpinner } from './LoadingSpinner';

const EditLinkFormFields = ({ link, onClose, onSave, isOnline, announce }) => {
  const [fullUrl, setFullUrl] = useState(link.full_url || '');
  const [shortUrl, setShortUrl] = useState(link.short_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    mergeFieldErrors
  } = useFormValidation(['fullUrl', 'shortUrl'], getRules);

  const formValues = { fullUrl, shortUrl };
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
      await onSave({ full_url: fullUrl.trim(), short_url: shortUrl.trim() });
      announce('Link updated');
      onClose();
    } catch (err) {
      handleApiFormError(
        err,
        { setError, mergeFieldErrors },
        {
          fallbackMessage: 'Failed to update link',
          fieldMap: {
            full_url: 'fullUrl',
            short_url: 'shortUrl',
            custom_url: 'shortUrl'
          }
        }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="edit-link-modal-title"
    >
      <div className="flex flex-col gap-4">
        <FormField
          id="edit-full-url"
          label="Destination URL"
          type="url"
          value={fullUrl}
          onChange={(e) => updateField('fullUrl', e.target.value, setFullUrl)}
          onBlur={() => handleBlur('fullUrl', formValues)}
          error={fieldErrors.fullUrl}
          touched={touched.fullUrl}
          placeholder="https://example.com/your-long-link"
          autoComplete="url"
        />

        <EditLinkShortAliasField
          shortUrl={shortUrl}
          onChange={(e) => updateField('shortUrl', e.target.value, setShortUrl)}
          onBlur={() => handleBlur('shortUrl', formValues)}
          error={fieldErrors.shortUrl}
          touched={touched.shortUrl}
        />

        <FormAlert error={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="sm-btn sm-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isOnline}
            aria-busy={saving}
            className="sm-btn sm-btn-primary"
          >
            {saving ? (
              <>
                <BrandedSpinner size="sm" decorative />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
            <span className="sr-only" aria-live="polite">
              {saving ? 'Saving' : ''}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditLinkFormFields;
