import { BrandedSpinner } from '../LoadingSpinner';
import { formCompoundClass } from '../../utils/designFormClasses';

const getContainerClass = (showPrefix, hasError) =>
  showPrefix
    ? `hero-form-compound${hasError ? ' hero-form-compound-error' : ''}`
    : formCompoundClass(hasError);

const getLabelText = (showPrefix) =>
  showPrefix ? 'Long URL' : 'Enter your long URL';

const getPlaceholder = (showPrefix) =>
  showPrefix
    ? 'https://example.com/your-long-link'
    : 'Enter your long URL here...';

const getErrorClass = (showPrefix) =>
  `hero-form-error${showPrefix ? '' : ' px-4 pb-3'}`;

const SubmitButton = ({ loading, showPrefix }) => (
  <button
    type="submit"
    disabled={loading}
    aria-busy={loading}
    className={`hero-cli-submit${showPrefix ? ' focus-ring' : ''}`}
  >
    {loading ? <BrandedSpinner size="sm" decorative /> : 'Shorten'}
  </button>
);

const UrlInputBar = ({
  url,
  setUrl,
  loading,
  fieldErrors,
  touched,
  handleChange,
  handleBlur,
  showPrefix,
  children
}) => {
  const urlHasError = Boolean(touched.url && fieldErrors.url);

  return (
    <div className={getContainerClass(showPrefix, urlHasError)}>
      <label htmlFor="url-input" className="sr-only">
        {getLabelText(showPrefix)}
      </label>
      <div className="hero-cli-bar">
        {showPrefix && (
          <span className="hero-cli-prefix" aria-hidden="true">
            url
          </span>
        )}
        <input
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => handleChange('url', e.target.value, setUrl)}
          onBlur={(e) => handleBlur('url', e.target.value)}
          placeholder={getPlaceholder(showPrefix)}
          className="hero-cli-input"
          aria-invalid={urlHasError ? 'true' : 'false'}
          aria-describedby={fieldErrors.url ? 'url-error' : undefined}
          autoComplete="url"
        />
        <SubmitButton loading={loading} showPrefix={showPrefix} />
      </div>
      {showPrefix && children}
      {urlHasError && (
        <p id="url-error" className={getErrorClass(showPrefix)} role="alert">
          {fieldErrors.url}
        </p>
      )}
    </div>
  );
};

export default UrlInputBar;
