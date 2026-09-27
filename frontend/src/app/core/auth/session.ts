import { AuthUser } from './auth.models';

export function getSessionUser(): AuthUser | null {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    const user: unknown = JSON.parse(storedUser);
    if (
      typeof user === 'object' &&
      user !== null &&
      'name' in user &&
      typeof user.name === 'string' &&
      'userId' in user &&
      typeof user.userId === 'string'
    ) {
      return user as AuthUser;
    }
  } catch {
    return null;
  }

  return null;
}

export function clearSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
