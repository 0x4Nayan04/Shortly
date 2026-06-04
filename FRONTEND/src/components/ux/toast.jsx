import { memo } from 'react';
import { Toaster } from 'react-hot-toast';
import { toastConfig } from '../../utils/showToast';

export const ToastProvider = memo(({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        gutter={16}
        containerStyle={{
          bottom: 24,
          right: 24
        }}
        toastOptions={{
          style: toastConfig.style,
          success: toastConfig.success,
          error: toastConfig.error,
          loading: toastConfig.loading
        }}
      />
    </>
  );
});

ToastProvider.displayName = 'ToastProvider';
