import { lazy, Suspense } from 'react';
import { LiveRegion } from './Accessibility';
import { useUrlFormController } from '../hooks/useUrlFormController';
import UrlFormFields from './urlForm/UrlFormFields';
import UrlFormResult from './urlForm/UrlFormResult';

const ShareModal = lazy(() => import('./ShareModal'));

const UrlForm = ({ onUrlCreated, user, onShowAuth, variant = 'default' }) => {
  const isLanding = variant === 'landing';
  const controller = useUrlFormController({ user, onShowAuth, onUrlCreated });
  const { state, validation } = controller;

  return (
    <div className={isLanding ? '' : 'space-y-6'}>
      <LiveRegion message={controller.announcement} politeness="polite" />

      <UrlFormFields
        isLanding={isLanding}
        user={user}
        onShowAuth={onShowAuth}
        state={state}
        validation={validation}
        onSetField={controller.setField}
        onBlurField={controller.blurField}
        onCustomAliasChange={controller.changeCustomAlias}
        onCustomAliasBlur={controller.blurCustomAlias}
        onToggleLandingCustomAlias={controller.toggleLandingCustomAlias}
        onChangeDefaultCustomAlias={controller.changeDefaultCustomAlias}
        onSubmit={controller.submit}
      />

      {state.shortUrl && (
        <UrlFormResult
          ref={controller.resultRef}
          shortUrl={state.shortUrl}
          isLanding={isLanding}
          user={user}
          onShowAuth={onShowAuth}
          isCopied={controller.isShortUrlCopied}
          onCopy={controller.copyShortUrl}
          onShare={controller.openShare}
          createdLink={state.createdLink}
        />
      )}

      {state.shareOpen && (
        <Suspense fallback={null}>
          <ShareModal
            isOpen={state.shareOpen}
            onClose={controller.closeShare}
            shortUrl={state.createdLink?.slug}
            fullUrl={state.createdLink?.fullUrl}
          />
        </Suspense>
      )}
    </div>
  );
};

export default UrlForm;
