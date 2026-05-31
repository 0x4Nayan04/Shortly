/**
 * UX enhancement components and hooks — barrel re-export.
 * Implementation lives in ./ux/* modules.
 */

/* eslint-disable react-refresh/only-export-components */

export {
  toastConfig,
  OFFLINE_TOAST_ID,
  showToast,
  ToastProvider
} from './ux/toast';

export {
  OnlineStatusProvider,
  useOnlineStatus,
  OfflineBanner
} from './ux/onlineStatus';

export { LoadingButton } from './ux/loading';

export { ErrorRecovery } from './ux/errorRecovery';

export { EmptyState } from './ux/emptyState';

export { useConfirmDialog, ConfirmDialog } from './ux/confirmDialog';

export { useCopyToClipboard } from './ux/copyToClipboard';

export { useUnsavedChanges } from './ux/unsavedChanges';

export { useUnsavedNavigationGuard } from '../hooks/useUnsavedNavigationGuard';
