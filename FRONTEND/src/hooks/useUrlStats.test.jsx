import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { useUrlStats } from './useUrlStats';
import { getUrlStats, getUrlClickAnalytics } from '../api/shortUrl.api';

vi.mock('../api/shortUrl.api', () => ({
  getUrlStats: vi.fn(),
  getUrlClickAnalytics: vi.fn(),
  getMyUrls: vi.fn()
}));

it('keeps existing statistics visible while refreshing the overview without reloading click analytics', async () => {
  getUrlStats.mockResolvedValueOnce({ data: { stats: { totalUrls: 1 } } });
  getUrlClickAnalytics.mockResolvedValue({ data: { clickAnalytics: { totalClicks: 2 } } });
  let finishRefresh;
  getUrlStats.mockImplementationOnce(() => new Promise((resolve) => { finishRefresh = resolve; }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useUrlStats(true), { wrapper });
  await waitFor(() => expect(result.current.stats?.clickAnalytics?.totalClicks).toBe(2));

  let pending;
  act(() => { pending = result.current.refetchOverview(); });
  await waitFor(() => expect(getUrlStats).toHaveBeenCalledTimes(2));
  expect(result.current.loading).toBe(false);
  expect(result.current.stats.stats.totalUrls).toBe(1);
  expect(getUrlClickAnalytics).toHaveBeenCalledTimes(1);
  await act(async () => {
    finishRefresh({ data: { stats: { totalUrls: 2 } } });
    await pending;
  });
  await waitFor(() => expect(result.current.stats.stats.totalUrls).toBe(2));
  expect(result.current.stats.clickAnalytics.totalClicks).toBe(2);
});
