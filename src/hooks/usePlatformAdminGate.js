import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { checkIsPlatformAdmin } from '../lib/platform-admin/platformAdminService';

export function usePlatformAdminGate() {
  const { user, initializing, isAuthenticated } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsPlatformAdmin(false);
      setChecking(false);
      return false;
    }

    setChecking(true);
    const { isAdmin } = await checkIsPlatformAdmin();
    setIsPlatformAdmin(isAdmin);
    setChecking(false);
    return isAdmin;
  }, [isAuthenticated, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    initializing: initializing || checking,
    isAuthenticated,
    isPlatformAdmin,
    refresh,
    user,
  };
}
