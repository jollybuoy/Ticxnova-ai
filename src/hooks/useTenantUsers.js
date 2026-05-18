import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  adminDeleteTenantUser,
  adminResetTenantUserPassword,
  adminUpdateTenantUser,
  fetchRoles,
  fetchTenantUsers,
  getTenantErrorMessage,
  inviteTenantUser,
  updateTenantUser,
} from '../lib/tenant/tenantService';
import { useTenant } from './useTenant';

export function useTenantUsers() {
  const { tenantId, role } = useTenant();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [usersResult, rolesResult] = await Promise.all([
      fetchTenantUsers(tenantId),
      fetchRoles(tenantId),
    ]);
    if (usersResult.error) toast.error(getTenantErrorMessage(usersResult.error));
    if (rolesResult.error) toast.error(getTenantErrorMessage(rolesResult.error));
    setUsers(usersResult.data ?? []);
    setRoles(rolesResult.data ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    const task = window.setTimeout(load, 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const inviteUser = useCallback(
    async (payload) => {
      if (!tenantId) return { success: false };
      setMutating(true);
      const { data, error } = await inviteTenantUser(tenantId, payload);
      setMutating(false);
      if (error) {
        toast.error(getTenantErrorMessage(error));
        return { success: false };
      }
      const invited = data?.invited ?? [];
      const rejected = data?.rejected ?? [];
      if (invited.length > 0) {
        setUsers((prev) => [
          ...invited,
          ...prev.filter((item) => !invited.some((invitedUser) => invitedUser.id === item.id)),
        ]);
      }
      if (rejected.length > 0) {
        toast.error(`${rejected.length} user${rejected.length === 1 ? '' : 's'} rejected`);
      }
      if (invited.length > 0) {
        toast.success(`${invited.length} user${invited.length === 1 ? '' : 's'} created`);
      }
      return { success: true, data };
    },
    [tenantId],
  );

  const updateUser = useCallback(async (userId, updates) => {
    setMutating(true);
      const { data, error } = await updateTenantUser(userId, updates);
    setMutating(false);
    if (error) {
      toast.error(getTenantErrorMessage(error));
      return { success: false };
    }
    setUsers((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    toast.success('User updated');
    return { success: true, data };
  }, []);

  const adminUpdateUser = useCallback(
    async (userId, updates) => {
      if (!tenantId) return { success: false };
      setMutating(true);
      const { data, error } = await adminUpdateTenantUser(tenantId, userId, updates);
      setMutating(false);
      if (error) {
        toast.error(getTenantErrorMessage(error));
        return { success: false };
      }
      setUsers((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      toast.success('User account updated');
      return { success: true, data };
    },
    [tenantId],
  );

  const deleteUser = useCallback(
    async (userId) => {
      if (!tenantId) return { success: false };
      setMutating(true);
      const { error } = await adminDeleteTenantUser(tenantId, userId);
      setMutating(false);
      if (error) {
        toast.error(getTenantErrorMessage(error));
        return { success: false };
      }
      setUsers((prev) => prev.filter((item) => item.id !== userId));
      toast.success('User account deleted');
      return { success: true };
    },
    [tenantId],
  );

  const resetPassword = useCallback(
    async (userId) => {
      if (!tenantId) return { success: false };
      setMutating(true);
      const { data, error } = await adminResetTenantUserPassword(tenantId, userId);
      setMutating(false);
      if (error) {
        toast.error(getTenantErrorMessage(error));
        return { success: false };
      }
      toast.success('Temporary password generated');
      return { success: true, data };
    },
    [tenantId],
  );

  return useMemo(
    () => ({
      users,
      roles,
      loading,
      mutating,
      currentRole: role,
      refetch: load,
      inviteUser,
      updateUser,
      adminUpdateUser,
      deleteUser,
      resetPassword,
    }),
    [
      adminUpdateUser,
      deleteUser,
      inviteUser,
      load,
      loading,
      mutating,
      resetPassword,
      role,
      roles,
      updateUser,
      users,
    ],
  );
}
