import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import {
  ensureTenantForUser,
  fetchTenantContext,
  getTenantErrorMessage,
  updateProfile,
  updateTenant,
} from '../lib/tenant/tenantService';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [mutating, setMutating] = useState(false);
  const initialLoadRef = useRef(true);

  const loadTenant = useCallback(
    async ({ silent = false } = {}) => {
      if (!userId) {
        setProfile(null);
        setTenant(null);
        setLoading(false);
        initialLoadRef.current = true;
        return;
      }

      if (!silent && initialLoadRef.current) {
        setLoading(true);
      }

      const { profile: nextProfile, tenant: nextTenant, error } = await fetchTenantContext(userId);
      if (error) {
        toast.error(getTenantErrorMessage(error));
      }
      setProfile(nextProfile);
      setTenant(nextTenant);
      setLoading(false);
      initialLoadRef.current = false;
    },
    [userId],
  );

  useEffect(() => {
    void loadTenant({ silent: false });
  }, [userId, loadTenant]);

  const saveTenant = useCallback(
    async (updates) => {
      if (!user) return { success: false };
      setMutating(true);
      let activeTenant = tenant;

      if (!activeTenant?.id) {
        const ensured = await ensureTenantForUser(user, profile?.full_name);
        if (ensured.error) {
          setMutating(false);
          toast.error(getTenantErrorMessage(ensured.error));
          return { success: false };
        }
        activeTenant = ensured.data?.tenant;
        setProfile(ensured.data?.profile ?? null);
        setTenant(ensured.data?.tenant ?? null);
      }

      if (!activeTenant?.id) {
        setMutating(false);
        toast.error('Unable to create tenant context for this user.');
        return { success: false };
      }

      const { data, error } = await updateTenant(activeTenant.id, updates);
      setMutating(false);
      if (error) {
        toast.error(getTenantErrorMessage(error));
        return { success: false };
      }
      setTenant(data);
      toast.success('Organization updated');
      return { success: true, data };
    },
    [profile?.full_name, tenant, user],
  );

  const saveProfile = useCallback(
    async (updates) => {
      if (!userId) return { success: false };
      setMutating(true);
      if (!profile?.id && user) {
        const ensured = await ensureTenantForUser(user, updates.full_name);
        if (ensured.error) {
          setMutating(false);
          toast.error(getTenantErrorMessage(ensured.error));
          return { success: false };
        }
        setProfile(ensured.data?.profile ?? null);
        setTenant(ensured.data?.tenant ?? null);
      }
      const { data, error } = await updateProfile(userId, updates);
      setMutating(false);
      if (error) {
        toast.error(getTenantErrorMessage(error));
        return { success: false };
      }
      setProfile(data);
      toast.success('Profile updated');
      return { success: true, data };
    },
    [profile?.id, user, userId],
  );

  const value = useMemo(
    () => ({
      tenant,
      tenantId: tenant?.id ?? profile?.tenant_id ?? null,
      profile,
      role: profile?.role ?? 'employee',
      loading,
      mutating,
      refetch: () => loadTenant({ silent: true }),
      saveTenant,
      saveProfile,
    }),
    [loadTenant, loading, mutating, profile, saveProfile, saveTenant, tenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenantContext() {
  return useContext(TenantContext);
}
