import { useCallback } from 'react';
import {
  bulkDeleteUrls,
  deleteShortUrl,
  updateShortUrl
} from '../api/shortUrl.api';
import { showToast } from '../utils/showToast';
import { getApiErrorMessage } from '../utils/apiErrorMessage';
import { getApiPayload } from '../utils/axiosInstance';

const pluralizeLinks = (count) => `link${count === 1 ? '' : 's'}`;

export const useDashboardMutations = ({
  myUrls,
  setMyUrls,
  setTotalCount,
  fetchMyUrls,
  refresh,
  refetchStats,
  isOnline,
  confirm,
  announce,
  dispatchUi,
  ui
}) => {
  const { selectedIds, editingLink } = ui;

  const clearSelection = useCallback(() => {
    dispatchUi({ type: 'setSelectedIds', value: new Set() });
  }, [dispatchUi]);

  const handleDeleteUrl = useCallback(
    async (urlId, shortUrl) => {
      const confirmed = await confirm({
        title: 'Delete link',
        message: `Delete "${shortUrl}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'danger'
      });
      if (!confirmed) return;
      if (!isOnline) {
        showToast.error("You're offline. Cannot delete link.");
        return;
      }

      dispatchUi({ type: 'setDeletingUrl', value: urlId });
      const deleteToast = showToast.loading('Deleting link…');
      try {
        await deleteShortUrl(urlId);
        setTotalCount((prev) => Math.max(0, prev - 1));
        setMyUrls((prev) => prev.filter((url) => url._id !== urlId));
        dispatchUi({
          type: 'setSelectedIds',
          value: (prev) => {
            const next = new Set(prev);
            next.delete(urlId);
            return next;
          }
        });
        showToast.dismiss(deleteToast);
        showToast.success('Link deleted');
        announce('Link deleted');
        refetchStats();
      } catch {
        showToast.dismiss(deleteToast);
        showToast.error('Failed to delete link');
        announce('Error deleting link');
        fetchMyUrls();
      } finally {
        dispatchUi({ type: 'setDeletingUrl', value: null });
      }
    },
    [
      confirm,
      isOnline,
      dispatchUi,
      setMyUrls,
      setTotalCount,
      announce,
      refetchStats,
      fetchMyUrls
    ]
  );

  const handleEditUrl = useCallback(
    (url) => dispatchUi({ type: 'setEditingLink', value: url }),
    [dispatchUi]
  );

  const handleSaveEdit = useCallback(
    async (updates) => {
      if (!editingLink) return;

      const apiUpdates = {};
      if (updates.full_url !== editingLink.full_url) {
        apiUpdates.full_url = updates.full_url;
      }
      if (updates.short_url.toLowerCase() !== editingLink.short_url) {
        apiUpdates.short_url = updates.short_url;
      }

      if (Object.keys(apiUpdates).length === 0) {
        dispatchUi({ type: 'setEditingLink', value: null });
        return;
      }

      dispatchUi({ type: 'setUpdatingUrl', value: editingLink._id });
      try {
        await updateShortUrl(editingLink._id, apiUpdates);
        showToast.success('Link updated');
        refresh();
      } finally {
        dispatchUi({ type: 'setUpdatingUrl', value: null });
      }
    },
    [editingLink, refresh, dispatchUi]
  );

  const handleToggleDisabled = useCallback(
    async (url) => {
      const nextDisabled = !url.disabled;
      const confirmed = await confirm({
        title: nextDisabled ? 'Disable link' : 'Enable link',
        message: nextDisabled
          ? `Disable "${url.short_url}"? Visitors will get a not found response until you enable it again.`
          : `Enable "${url.short_url}" so visitors can use it again?`,
        confirmLabel: nextDisabled ? 'Disable' : 'Enable',
        cancelLabel: 'Cancel',
        variant: nextDisabled ? 'danger' : 'default'
      });
      if (!confirmed) return;
      if (!isOnline) {
        showToast.error("You're offline. Cannot update link.");
        return;
      }

      dispatchUi({ type: 'setUpdatingUrl', value: url._id });
      const updateToast = showToast.loading(
        nextDisabled ? 'Disabling link...' : 'Enabling link...'
      );
      try {
        await updateShortUrl(url._id, { disabled: nextDisabled });
        showToast.dismiss(updateToast);
        showToast.success(nextDisabled ? 'Link disabled' : 'Link enabled');
        announce(nextDisabled ? 'Link disabled' : 'Link enabled');
        refresh();
      } catch (err) {
        showToast.dismiss(updateToast);
        showToast.error(getApiErrorMessage(err, 'Failed to update link'));
      } finally {
        dispatchUi({ type: 'setUpdatingUrl', value: null });
      }
    },
    [confirm, isOnline, dispatchUi, announce, refresh]
  );

  const handleSelectUrl = useCallback(
    (id, selected) => {
      dispatchUi({
        type: 'setSelectedIds',
        value: (prev) => {
          const next = new Set(prev);
          if (selected) next.add(id);
          else next.delete(id);
          return next;
        }
      });
    },
    [dispatchUi]
  );

  const handleSelectAll = useCallback(() => {
    dispatchUi({
      type: 'setSelectedIds',
      value: new Set(myUrls.map((url) => url._id))
    });
  }, [myUrls, dispatchUi]);

  const handleDeselectAll = useCallback(
    () => dispatchUi({ type: 'setSelectedIds', value: new Set() }),
    [dispatchUi]
  );

  const handleBulkDelete = useCallback(async () => {
    const count = selectedIds.size;
    const confirmed = await confirm({
      title: 'Delete selected links',
      message: `Delete ${count} ${pluralizeLinks(count)}? This cannot be undone.`,
      confirmLabel: `Delete ${count}`,
      cancelLabel: 'Cancel',
      variant: 'danger'
    });
    if (!confirmed) return;
    if (!isOnline) {
      showToast.error("You're offline. Cannot delete links.");
      return;
    }

    dispatchUi({ type: 'setIsBulkDeleting', value: true });
    const deleteToast = showToast.loading(`Deleting ${count} links…`);
    try {
      const response = await bulkDeleteUrls(Array.from(selectedIds));
      const payload = getApiPayload(response);
      const deletedCount = payload?.deletedCount ?? count;
      const skippedCount = payload?.skippedIds?.length ?? 0;
      showToast.dismiss(deleteToast);
      const summary = `Deleted ${deletedCount} ${pluralizeLinks(deletedCount)}`;
      showToast.success(
        skippedCount > 0 ? `${summary}; ${skippedCount} skipped` : summary
      );
      announce(`Deleted ${deletedCount} links`);
      clearSelection();
      refresh();
    } catch {
      showToast.dismiss(deleteToast);
      showToast.error('Failed to delete some links');
      announce('Error deleting links');
      fetchMyUrls();
    } finally {
      dispatchUi({ type: 'setIsBulkDeleting', value: false });
    }
  }, [
    selectedIds,
    confirm,
    isOnline,
    dispatchUi,
    clearSelection,
    refresh,
    fetchMyUrls,
    announce
  ]);

  const isAllSelected = myUrls.length > 0 && selectedIds.size === myUrls.length;

  return {
    handleDeleteUrl,
    handleEditUrl,
    handleSaveEdit,
    handleToggleDisabled,
    handleSelectUrl,
    handleSelectAll,
    handleDeselectAll,
    handleBulkDelete,
    isAllSelected
  };
};
