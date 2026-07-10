import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTenantUsers } from '../lib/tenant/tenantService';
import { useTenant } from './useTenant';

function userLabel(user) {
  const name = user.full_name || user.email;
  return user.full_name ? `${name} · ${user.email}` : user.email;
}

const usersCache = { key: null, data: [] };

function readUsersCache(tenantId) {
  return usersCache.key === tenantId ? usersCache.data : [];
}

function writeUsersCache(tenantId, data) {
  usersCache.key = tenantId;
  usersCache.data = data;
}

export function useTenantDirectory() {
  const { tenantId } = useTenant();
  const [users, setUsers] = useState(() => readUsersCache(tenantId));
  const [loading, setLoading] = useState(() => readUsersCache(tenantId).length === 0);

  const load = useCallback(async (options = {}) => {
    const { background = false } = options;
    if (!tenantId) return;

    if (!background && readUsersCache(tenantId).length === 0) {
      setLoading(true);
    }

    const { data } = await fetchTenantUsers(tenantId);
    const next = (data ?? []).filter((user) => user.is_active);
    setUsers(next);
    writeUsersCache(tenantId, next);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    const cached = readUsersCache(tenantId);
    if (cached.length) {
      setUsers(cached);
      setLoading(false);
      load({ background: true });
      return;
    }
    const task = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(task);
  }, [load, tenantId]);

  const departments = useMemo(
    () => [...new Set(users.map((user) => user.department).filter(Boolean))].sort(),
    [users],
  );

  const departmentOptions = useMemo(
    () => departments.map((department) => ({ value: department, label: department })),
    [departments],
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.email,
        label: userLabel(user),
        department: user.department,
        full_name: user.full_name,
        email: user.email,
      })),
    [users],
  );

  const usersForDepartment = useCallback(
    (department) =>
      userOptions.filter((user) => !department || !user.department || user.department === department),
    [userOptions],
  );

  return {
    users,
    loading,
    departments,
    departmentOptions,
    userOptions,
    usersForDepartment,
    refetch: load,
  };
}
