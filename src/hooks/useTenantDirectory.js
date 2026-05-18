import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTenantUsers } from '../lib/tenant/tenantService';
import { useTenant } from './useTenant';

function userLabel(user) {
  const name = user.full_name || user.email;
  return user.full_name ? `${name} · ${user.email}` : user.email;
}

export function useTenantDirectory() {
  const { tenantId } = useTenant();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await fetchTenantUsers(tenantId);
    setUsers((data ?? []).filter((user) => user.is_active));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    const task = window.setTimeout(load, 0);
    return () => window.clearTimeout(task);
  }, [load]);

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
