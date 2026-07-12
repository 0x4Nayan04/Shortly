import { AlertCircle } from 'lucide-react';
import { formAlertClass } from '../../utils/designFormClasses';
import UrlInputBar from './UrlInputBar';
import LandingCustomAliasSection from './LandingCustomAliasSection';
import DefaultCustomAliasSection from './DefaultCustomAliasSection';

const UrlFormFields = ({
  isLanding,
  user,
  onShowAuth,
  state,
  validation,
  onSetField,
  onBlurField,
  onCustomAliasChange,
  onCustomAliasBlur,
  onToggleLandingCustomAlias,
  onChangeDefaultCustomAlias,
  onSubmit
}) => (
  <form
    onSubmit={onSubmit}
    noValidate
    className={isLanding ? 'pt-0' : 'space-y-4'}
    aria-label="URL shortener form"
  >
    <UrlInputBar
      url={state.url}
      setUrl={(value) => onSetField('url', value)}
      loading={state.loading}
      fieldErrors={validation.fieldErrors}
      touched={validation.touched}
      handleChange={onSetField}
      handleBlur={onBlurField}
      showPrefix={isLanding}
    >
      {isLanding && (
        <LandingCustomAliasSection
          user={user}
          onShowAuth={onShowAuth}
          useCustomAlias={state.useCustomAlias}
          onToggleCustomAlias={onToggleLandingCustomAlias}
          customAlias={state.customAlias}
          onCustomAliasChange={onCustomAliasChange}
          onCustomAliasBlur={onCustomAliasBlur}
          touched={validation.touched}
          fieldErrors={validation.fieldErrors}
        />
      )}
    </UrlInputBar>

    {!isLanding && (
      <DefaultCustomAliasSection
        user={user}
        useCustomAlias={state.useCustomAlias}
        onUseCustomAliasChange={onChangeDefaultCustomAlias}
        customAlias={state.customAlias}
        onCustomAliasChange={onCustomAliasChange}
        onCustomAliasBlur={onCustomAliasBlur}
        touched={validation.touched}
        fieldErrors={validation.fieldErrors}
      />
    )}

    {state.error && (
      <div className={formAlertClass} role="alert" aria-live="assertive">
        <div className="flex items-center">
          <AlertCircle className="size-5 mr-2 shrink-0" aria-hidden="true" />
          {state.error}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onSubmit()}
            className="sm-btn sm-btn-primary text-sm !bg-[#dc2626] hover:!opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    )}
  </form>
);

export default UrlFormFields;
