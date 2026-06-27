import { useMemo, type ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';
import { ROLES, ALL_PERMISSIONS } from '../config/constants';
import type { Permission } from '../config/constants';

/**
 * Returns the current user's permissions.
 * For now, ADMIN role receives all permissions.
 * Extensible: replace with backend-driven permissions when needed.
 */
export function usePermissions() {
  const user = useAppSelector((s) => s.auth.user);

  const permissions = useMemo<Permission[]>(() => {
    if (!user) return [];
    if (user.role === ROLES.ADMIN) return ALL_PERMISSIONS;
    return [];
  }, [user]);

  const hasPermission = useMemo(
    () => (permission: Permission) => permissions.includes(permission),
    [permissions]
  );

  return { permissions, hasPermission };
}

/**
 * Declarative permission gate.
 * Renders children only if the user has the required permission.
 * Optional fallback for unauthorized state.
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
