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

    useBodyScrollLock(isOpen);

    useEffect(() => {
      if (isOpen) {
        dialogRef.current?.focus();
      }
    }, [isOpen]);

    const onCancelRef = useRef(onCancel);
    onCancelRef.current = onCancel;

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape' && isOpen) {
          onCancelRef.current?.();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    if (!isOpen) return null;

    const confirmButtonClasses =
      variant === 'danger'
        ? 'sm-btn bg-[#dc2626] text-white hover:opacity-90'
        : 'sm-btn sm-btn-primary';

    const overlay = (
      <div
        className='confirm-dialog-overlay fixed inset-0 z-[100] flex items-center justify-center p-4'
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'>
        <div
          className='absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] backdrop-blur-sm'
          onClick={onCancel}
          aria-hidden='true'
        />

        <div
          ref={dialogRef}
          tabIndex={-1}
          className='relative app-panel max-w-md w-full animate-scale-in'>
          <h2
            id='confirm-dialog-title'
            className='text-lg font-semibold text-ink mb-2'>
            {title}
          </h2>
          <p className='text-muted-strong mb-6'>{message}</p>

          <div className='flex gap-3 justify-end'>
            <button
              onClick={onCancel}
              className='sm-btn sm-btn-secondary'>
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={confirmButtonClasses}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );

    return createPortal(overlay, document.body);
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';
