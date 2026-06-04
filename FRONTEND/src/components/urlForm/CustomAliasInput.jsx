import { getPublicShortBaseUrl } from '../../utils/publicShortUrl';

const CustomAliasInput = ({
  customAlias,
  onChange,
  onBlur,
  touched,
  fieldErrors,
  placeholder = 'my-link'
}) => {
  const hasError = touched.customAlias && fieldErrors.customAlias;

  return (
    <div className="hero-alias-field">
      <label htmlFor="custom-alias-input" className="sr-only">
        Custom alias
      </label>
      <div className="hero-cli-bar hero-alias-bar">
        <span className="hero-cli-prefix shrink-0" aria-hidden="true">
          {getPublicShortBaseUrl()}/
        </span>
        <input
          id="custom-alias-input"
          type="text"
          value={customAlias}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className="hero-cli-input font-mono text-sm"
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={
            fieldErrors.customAlias ? 'customAlias-error' : 'customAlias-hint'
          }
          autoComplete="off"
        />
      </div>
      {hasError ? (
        <p
          id="customAlias-error"
          className="hero-form-error hero-alias-footnote"
          role="alert"
        >
          {fieldErrors.customAlias}
        </p>
      ) : (
        <p id="customAlias-hint" className="hero-form-hint hero-alias-footnote">
          3–20 chars · letters, numbers, hyphens, underscores
        </p>
      )}
    </div>
  );
};

export default CustomAliasInput;
