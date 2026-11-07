import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuthSession } from '../contexts/AuthContext';
import ProtectedLayout from '../layouts/ProtectedLayout';
import GuestOnlyLayout from '../layouts/GuestOnlyLayout';

vi.mock('../api/user.api', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ user: { _id: 'user-1' } }),
  logoutUser: vi.fn().mockResolvedValue({})
}));
vi.mock('../hooks/useUrlStats', () => ({
  useUrlStats: () => ({ reset: vi.fn(), refetch: vi.fn() })
}));
vi.mock('../hooks/dashboardQueries', () => ({ prefetchDashboardQueries: vi.fn() }));
vi.mock('../utils/claimAnonymousLinks', () => ({ claimStoredAnonymousLinks: vi.fn() }));
vi.mock('../utils/showToast', () => ({ showToast: { success: vi.fn() } }));
vi.mock('../components/UxEnhancements', () => ({
  ConfirmDialog: () => null,
  useConfirmDialog: () => ({ confirm: () => Promise.resolve(true) })
}));

function Dashboard() {
  const { logout } = useAuthSession();
  return <button onClick={logout}>Sign out</button>;
}

describe('explicit logout navigation', () => {
  it('finishes on the landing page without a login redirect and replaces dashboard history', async () => {
    const router = createMemoryRouter([{
      element: <AuthProvider><Outlet /></AuthProvider>,
      children: [
        { element: <GuestOnlyLayout />, children: [
          { path: '/', element: <h1>Landing page</h1> },
          { path: '/login', element: <h1>Login page</h1> }
        ] },
        { element: <ProtectedLayout />, children: [
          { path: '/dashboard', element: <Dashboard /> }
        ] }
      ]
    }], { initialEntries: ['/dashboard'] });
    const visited = [];
    const unsubscribe = router.subscribe((state) => visited.push(state.location.pathname));
    render(<RouterProvider router={router} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    await screen.findByRole('heading', { name: 'Landing page' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(visited).not.toContain('/login');
    expect(router.state.historyAction).toBe('REPLACE');
    unsubscribe();
  });
});
