/* eslint-disable react-refresh/only-export-components */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const useConfirmDialog = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        variant: options.variant || 'default',
        onConfirm: () => {
          setState((s) => ({ ...s, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((s) => ({ ...s, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  return { ...state, confirm, close };
};

export const ConfirmDialog = memo(
  ({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
    onConfirm,
    onCancel
  }) => {
    const dialogRef = useRef(null);
    const onCancelRef = useRef(onCancel);
    const onConfirmRef = useRef(onConfirm);
    onCancelRef.current = onCancel;
    onConfirmRef.current = onConfirm;

    useBodyScrollLock(isOpen);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (isOpen) {
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    }, [isOpen]);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog || !isOpen) return;

      const handleCancel = (event) => {
        event.preventDefault();
        onCancelRef.current?.();
      };

      dialog.addEventListener('cancel', handleCancel);
      return () => dialog.removeEventListener('cancel', handleCancel);
    }, [isOpen]);

    const confirmButtonClasses =
      variant === 'danger'
        ? 'sm-btn bg-[#dc2626] text-white hover:opacity-90'
        : 'sm-btn sm-btn-primary';

    return createPortal(
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[100] m-0 max-h-none max-w-none h-full w-full border-0 bg-transparent p-4 open:flex open:items-center open:justify-center backdrop:bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)]"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="app-panel max-w-md w-full animate-scale-in">
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-ink mb-2"
          >
            {title}
          </h2>
          <p className="text-muted-strong mb-6">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => onCancelRef.current?.()}
              className="sm-btn sm-btn-secondary"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => onConfirmRef.current?.()}
              className={confirmButtonClasses}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>,
      document.body
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';
