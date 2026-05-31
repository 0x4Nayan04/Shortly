import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useConfirmDialog } from '../components/ux/confirmDialog';
import { useUnsavedChanges } from '../components/ux/unsavedChanges';

const UNSAVED_LEAVE_OPTIONS = {
  title: 'Unsaved changes',
  message: 'You have unsaved changes. Are you sure you want to leave?',
  confirmLabel: 'Leave',
  cancelLabel: 'Stay',
  variant: 'danger'
};

/**
 * Blocks in-app navigation and tab close when a form has unsaved input.
 * Returns confirm-dialog props for `<ConfirmDialog {...unsavedDialog} />`.
 */
export const useUnsavedNavigationGuard = (hasUnsavedChanges) => {
  useUnsavedChanges(hasUnsavedChanges);
  const navigationBlocker = useBlocker(hasUnsavedChanges);
  const unsavedDialog = useConfirmDialog();

  useEffect(() => {
    if (navigationBlocker.state !== 'blocked') return;

    unsavedDialog.confirm(UNSAVED_LEAVE_OPTIONS).then((confirmed) => {
      if (confirmed) {
        navigationBlocker.proceed();
      } else {
        navigationBlocker.reset();
      }
    });
  }, [navigationBlocker.state]); // eslint-disable-line react-hooks/exhaustive-deps

  return unsavedDialog;
};
