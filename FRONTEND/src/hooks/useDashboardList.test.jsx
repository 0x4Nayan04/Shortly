import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { useDashboardList } from './useDashboardList';
import { getMyUrls } from '../api/shortUrl.api';
import { getDashboardLinksQueryKey } from './dashboardQueries';

vi.mock('../api/shortUrl.api', () => ({ getMyUrls: vi.fn(), getUrlStats: vi.fn(), getUrlClickAnalytics: vi.fn() }));

it('updates disabled state across cached lists for only the owning user', () => {
  const client = new QueryClient();
  const first = getDashboardLinksQueryKey('owner');
  const filtered = getDashboardLinksQueryKey('owner', { search: 'demo', sortBy: 'click' });
  const other = getDashboardLinksQueryKey('other');
  const urls = [{ _id: 'one', disabled: false, click: 5 }, { _id: 'two', disabled: false, click: 10 }];
  for (const key of [first, filtered, other]) {
    client.setQueryData(key, { urls, totalCount: 2, totalPages: 1 });
  }
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useDashboardList({
    userId: 'owner', announce: vi.fn(), isOnline: false
  }), { wrapper });

  act(() => result.current.updateCachedLink({ id: 'one', disabled: true, click: 99 }));
  for (const key of [first, filtered]) {
    const data = client.getQueryData(key);
    expect(data.urls).toEqual([{ ...urls[0], disabled: true }, urls[1]]);
    expect(data.totalCount).toBe(2);
    expect(data.totalPages).toBe(1);
  }
  expect(client.getQueryData(other).urls).toEqual(urls);
});

it('refreshes the active list once and marks other owner lists stale after an edit', async () => {
  const client = new QueryClient();
  const active = getDashboardLinksQueryKey('owner');
  const filtered = getDashboardLinksQueryKey('owner', { search: 'old' });
  const other = getDashboardLinksQueryKey('other');
  for (const key of [active, filtered, other]) {
    client.setQueryData(key, { urls: [], totalCount: 0 });
  }
  getMyUrls.mockResolvedValue({ data: { urls: [{ _id: 'new' }], totalCount: 1 } });
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useDashboardList({
    userId: 'owner', announce: vi.fn(), isOnline: true
  }), { wrapper });
  await act(async () => { await result.current.fetchMyUrls(); });
  expect(getMyUrls).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(active).urls).toEqual([{ _id: 'new' }]);
  expect(client.getQueryState(filtered).isInvalidated).toBe(true);
  expect(client.getQueryState(other).isInvalidated).toBe(false);
});
