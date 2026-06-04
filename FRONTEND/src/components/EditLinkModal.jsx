import { X } from 'lucide-react';
import { useAnnouncement, useFocusTrap } from './Accessibility';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useOnlineStatus } from './UxEnhancements';
import EditLinkFormFields from './EditLinkFormFields';

const EditLinkModal = ({ isOpen, onClose, link, onSave }) => {
  const { isOnline } = useOnlineStatus();
  const [announcement, announce] = useAnnouncement();
  const focusTrapRef = useFocusTrap(isOpen, {
    onEscape: onClose,
    restoreFocus: true
  });
  useBodyScrollLock(isOpen);

  if (!isOpen || !link) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      aria-labelledby="edit-link-modal-title"
    >
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={focusTrapRef}
        className="edit-link-modal relative app-panel w-full max-w-md max-h-[90dvh] overflow-y-auto scrollbar-hide animate-scale-in p-5 sm:p-6"
      >
        <div className="edit-link-modal__header flex items-center justify-between pb-4 mb-5 border-b border-border">
          <h2
            id="edit-link-modal-title"
            className="font-display text-xl font-semibold text-ink m-0 leading-none tracking-tight"
          >
            Edit link
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="landing-icon-btn shrink-0 size-8 rounded-full border border-border bg-surface-muted text-muted-strong hover:text-ink hover:border-primary transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <EditLinkFormFields
          key={link._id}
          link={link}
          onClose={onClose}
          onSave={onSave}
          isOnline={isOnline}
          announce={announce}
        />

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </div>
  );
};

export default EditLinkModal;
