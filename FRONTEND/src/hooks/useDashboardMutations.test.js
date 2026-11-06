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

import { deleteShortUrl, updateShortUrl } from '../api/shortUrl.api';
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

describe('dashboard mutation refreshes', () => {
  const link = { _id: '64f1c2ab3f1c2ab3f1c2ab3f', short_url: 'sample',
    full_url: 'https://example.com/before', disabled: false };
  const setup = () => {
    const props = {
      myUrls: [link], setMyUrls: vi.fn(), setTotalCount: vi.fn(),
      fetchMyUrls: vi.fn(), refresh: vi.fn(), refetchStats: vi.fn(),
      refetchOverview: vi.fn(), updateCachedLink: vi.fn(), isOnline: true,
      confirm: vi.fn().mockResolvedValue(true), announce: vi.fn(), dispatchUi: vi.fn(),
      ui: { selectedIds: new Set(), editingLink: link }
    };
    const hook = renderHook(() => useDashboardMutations(props));
    return { ...hook, props };
  };

  beforeEach(() => vi.clearAllMocks());

  it('applies the saved toggle response without follow-up GET requests', async () => {
    const { result, props } = setup();
    const saved = { id: link._id, disabled: true };
    let finish;
    updateShortUrl.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    let pending;
    await act(async () => { pending = result.current.handleToggleDisabled(link); });
    expect(props.updateCachedLink).not.toHaveBeenCalled();
    await act(async () => {
      finish({ data: { url: saved } });
      await pending;
    });
    expect(updateShortUrl).toHaveBeenCalledWith(link._id, { disabled: true });
    expect(props.updateCachedLink).toHaveBeenCalledWith(saved);
    expect(props.refresh).not.toHaveBeenCalled();
    expect(props.fetchMyUrls).not.toHaveBeenCalled();
    expect(props.refetchStats).not.toHaveBeenCalled();
    expect(props.refetchOverview).not.toHaveBeenCalled();
  });

  it('keeps rows unchanged and shows the error if toggle fails', async () => {
    const { result, props } = setup();
    updateShortUrl.mockRejectedValueOnce(new Error('failed'));
    await act(async () => { await result.current.handleToggleDisabled(link); });
    expect(props.updateCachedLink).not.toHaveBeenCalled();
    expect(showToast.error).toHaveBeenCalled();
    expect(showToast.success).not.toHaveBeenCalled();
  });

  it('refreshes list membership/order and overview after edit without fetching analytics', async () => {
    const { result, props } = setup();
    updateShortUrl.mockResolvedValueOnce({ data: { url: { id: link._id } } });
    await act(async () => {
      await result.current.handleSaveEdit({ ...link, full_url: 'https://example.com/after' });
    });
    expect(props.fetchMyUrls).toHaveBeenCalledTimes(1);
    expect(props.refetchOverview).toHaveBeenCalledTimes(1);
    expect(props.refetchStats).not.toHaveBeenCalled();
    expect(props.refresh).not.toHaveBeenCalled();
  });

  it('does not refresh or show success after a failed edit', async () => {
    const { result, props } = setup();
    updateShortUrl.mockRejectedValueOnce(new Error('conflict'));
    await act(async () => {
      await expect(result.current.handleSaveEdit({ ...link, short_url: 'occupied' }))
        .rejects.toThrow('conflict');
    });
    expect(props.fetchMyUrls).not.toHaveBeenCalled();
    expect(props.refetchOverview).not.toHaveBeenCalled();
    expect(showToast.success).not.toHaveBeenCalled();
  });
});
