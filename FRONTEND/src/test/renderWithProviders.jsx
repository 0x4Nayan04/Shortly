import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { OnlineStatusProvider } from '../components/ux/onlineStatus';

export const renderWithProviders = (ui, { route = '/' } = {}) => {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: <OnlineStatusProvider>{ui}</OnlineStatusProvider>
      }
    ],
    { initialEntries: [route] }
  );

  return render(<RouterProvider router={router} />);
};
