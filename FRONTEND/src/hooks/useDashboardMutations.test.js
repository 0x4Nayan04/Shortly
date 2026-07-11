import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDashboardMutations } from '../hooks/useDashboardMutations';

vi.mock('../api/shortUrl.api', () => ({
  deleteShortUrl: vi.fn(),
  bulkDeleteUrls: vi.fn(),
  updateShortUrl: vi.fn()
}));

vi.mock('../utils/showToast', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'loading-toast'),
    dismiss: vi.fn()
  }
}));

import { deleteShortUrl } from '../api/shortUrl.api';
import { showToast } from '../utils/showToast';

describe('useDashboardMutations', () => {
  const urlId = '64f1c2ab3f1c2ab3f1c2ab3f';
  const link = {
    _id: urlId,
    short_url: 'demo-link',
    full_url: 'https://example.com'
  };

  let dispatchUi;
  let setMyUrls;
  let setTotalCount;
  let confirm;
  let announce;
  let fetchMyUrls;
  let refetchStats;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchUi = vi.fn();
    setMyUrls = vi.fn((updater) => {
      if (typeof updater === 'function') {
        updater([link]);
      }
    });
    setTotalCount = vi.fn((updater) => {
      if (typeof updater === 'function') {
        updater(1);
      }
    });
    confirm = vi.fn().mockResolvedValue(true);
    announce = vi.fn();
    fetchMyUrls = vi.fn();
    refetchStats = vi.fn();
    deleteShortUrl.mockResolvedValue({ success: true });
  });

  it('deletes a link after confirmation', async () => {
    const { result } = renderHook(() =>
      useDashboardMutations({
        myUrls: [link],
        setMyUrls,
        setTotalCount,
        fetchMyUrls,
        refresh: vi.fn(),
        refetchStats,
        isOnline: true,
        confirm,
        announce,
        dispatchUi,
        ui: { selectedIds: new Set(), editingLink: null }
      })
    );

    await act(async () => {
      await result.current.handleDeleteUrl(urlId, 'demo-link');
    });

    expect(confirm).toHaveBeenCalled();
    expect(deleteShortUrl).toHaveBeenCalledWith(urlId);
    expect(showToast.success).toHaveBeenCalledWith('Link deleted');
    expect(announce).toHaveBeenCalledWith('Link deleted');
    expect(refetchStats).toHaveBeenCalled();
  });

  it('skips delete when the user cancels confirmation', async () => {
    confirm.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useDashboardMutations({
        myUrls: [link],
        setMyUrls,
        setTotalCount,
        fetchMyUrls,
        refresh: vi.fn(),
        refetchStats,
        isOnline: true,
        confirm,
        announce,
        dispatchUi,
        ui: { selectedIds: new Set(), editingLink: null }
      })
    );

    await act(async () => {
      await result.current.handleDeleteUrl(urlId, 'demo-link');
    });

    expect(deleteShortUrl).not.toHaveBeenCalled();
  });
});
