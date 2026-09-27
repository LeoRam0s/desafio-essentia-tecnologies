import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getSessionUser } from './session';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return localStorage.getItem('accessToken') && getSessionUser()
    ? true
    : router.parseUrl('/login');
};
