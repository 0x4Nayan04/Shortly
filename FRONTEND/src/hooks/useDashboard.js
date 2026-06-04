import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDashboardList } from './useDashboardList';
import { useDashboardMutations } from './useDashboardMutations';

export const useDashboard = ({
  userId,
  announce,
  isOnline,
  confirm,
  dispatchUi,
  ui,
  refetchStats
}) => {
  const list = useDashboardList({ userId, announce, isOnline });
  const { fetchMyUrls, loadList, myUrls, setMyUrls, setTotalCount } = list;
  const loadListRef = useRef(loadList);
  loadListRef.current = loadList;

  useEffect(() => {
    if (!userId) return;
    loadListRef.current();
  }, [userId]);
  const { selectedIds, editingLink } = ui;

  const visibleSelectedIds = useMemo(() => {
    const visible = new Set(myUrls.map((url) => url._id));
    return new Set([...selectedIds].filter((id) => visible.has(id)));
  }, [myUrls, selectedIds]);

  const refresh = useCallback(() => {
    fetchMyUrls();
    refetchStats();
  }, [fetchMyUrls, refetchStats]);

  const mutations = useDashboardMutations({
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
    ui: { selectedIds: visibleSelectedIds, editingLink }
  });

  return {
    ...list,
    visibleSelectedIds,
    refresh,
    ...mutations
  };
};
