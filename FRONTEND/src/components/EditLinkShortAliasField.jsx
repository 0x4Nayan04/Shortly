const EditLinkShortAliasField = ({
  shortUrl,
  onChange,
  onBlur,
  error,
  touched
}) => (
  <div>
    <label htmlFor="edit-short-url" className="sm-label">
      Short alias
    </label>
    <input
      id="edit-short-url"
      type="text"
      value={shortUrl}
      onChange={onChange}
      onBlur={onBlur}
      placeholder="my-link"
      className={`sm-input${touched && error ? ' sm-input--error' : ''} font-mono text-sm`}
      aria-invalid={touched && error ? 'true' : 'false'}
      aria-describedby={error ? 'edit-short-url-error' : 'edit-short-url-hint'}
      autoComplete="off"
    />
    {touched && error ? (
      <p id="edit-short-url-error" className="sm-field-error" role="alert">
        {error}
      </p>
    ) : (
      <p id="edit-short-url-hint" className="hero-form-hint">
        3–20 chars · letters, numbers, hyphens, underscores
      </p>
    )}
  </div>
);

export default EditLinkShortAliasField;
