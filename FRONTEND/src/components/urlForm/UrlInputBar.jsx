import { BrandedSpinner } from '../LoadingSpinner';
import { formCompoundClass } from '../../utils/designFormClasses';

const UrlInputBar = ({
  url,
  setUrl,
  loading,
  fieldErrors,
  touched,
  handleChange,
  handleBlur,
  showPrefix,
  shortUrl,
  children
}) => {
  const urlHasError = touched.url && fieldErrors.url;

  return (
    <div
      className={
        showPrefix
          ? `hero-form-compound${urlHasError ? ' hero-form-compound-error' : ''}`
          : formCompoundClass(urlHasError)
      }>
      <label
        htmlFor='url-input'
        className='sr-only'>
        {showPrefix ? 'Long URL' : 'Enter your long URL'}
      </label>
      <div className='hero-cli-bar'>
        {showPrefix && (
          <span
            className='hero-cli-prefix'
            aria-hidden='true'>
            url
          </span>
        )}
        <input
          id='url-input'
          type='url'
          value={url}
          onChange={(e) => handleChange('url', e.target.value, setUrl)}
          onBlur={(e) => handleBlur('url', e.target.value)}
          placeholder={
            showPrefix
              ? 'https://example.com/your-long-link'
              : 'Enter your long URL here...'
          }
          className='hero-cli-input'
          aria-invalid={urlHasError ? 'true' : 'false'}
          aria-describedby={fieldErrors.url ? 'url-error' : undefined}
          autoComplete='url'
        />
        <button
          type='submit'
          disabled={loading}
          aria-busy={loading}
          className={`hero-cli-submit${showPrefix ? ' focus-ring' : ''}`}>
          {loading ? (
            <BrandedSpinner
              size='sm'
              decorative
            />
          ) : (
            'Shorten'
          )}
        </button>
      </div>
      {showPrefix && children}
      {urlHasError && (
        <p
          id='url-error'
          className={`hero-form-error${showPrefix ? '' : ' px-4 pb-3'}`}
          role='alert'>
          {fieldErrors.url}
        </p>
      )}
      {url && !fieldErrors.url && !loading && !shortUrl && (
        <p
          className='truncate px-4 pb-3 font-mono text-xs text-muted'
          title={url}>
          {showPrefix ? null : <span aria-hidden='true'>→ </span>}
          {url}
        </p>
      )}
    </div>
  );
};

export default UrlInputBar;
