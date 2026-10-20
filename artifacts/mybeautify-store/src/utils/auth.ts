/**
 * Role and permission utilities
 */

/**
 * Checks whether an entity, role string, or user object has ADMIN authority.
 * Supports string, role arrays, Spring Security authorities array, or nested user object.
 */
export function hasAdminRole(value: unknown): boolean {
  if (typeof value === 'string') return value === 'ADMIN' || value === 'ROLE_ADMIN';
  if (!value || typeof value !== 'object') return false;
  if ('user' in value && hasAdminRole((value as Record<string, unknown>).user)) return true;

  const rawRoles = [
    (value as Record<string, unknown>).role,
    (value as Record<string, unknown>).roles,
    (value as Record<string, unknown>).authorities,
  ];

  return rawRoles.some((rawRole) => {
    const roles = Array.isArray(rawRole) ? rawRole : [rawRole];
    return roles.some((role) => {
      if (typeof role === 'string') return role === 'ADMIN' || role === 'ROLE_ADMIN';
      if (typeof role === 'object' && role !== null) {
        const authority = 'authority' in role ? (role as Record<string, unknown>).authority : undefined;
        if (typeof authority === 'string') return authority === 'ADMIN' || authority === 'ROLE_ADMIN';
        const name = 'name' in role ? (role as Record<string, unknown>).name : undefined;
        if (typeof name === 'string') return name === 'ADMIN' || name === 'ROLE_ADMIN';
      }
      return false;
    });
  });
}
