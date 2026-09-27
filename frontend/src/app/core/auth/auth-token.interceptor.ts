import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from './auth.service';
import type { RefreshTokenResponse } from './auth.models';
import { clearSession } from './session';

const PUBLIC_AUTH_ENDPOINTS = new Set([
  'api/auth/signin',
  'api/auth/signup',
  'api/auth/refresh-token',
]);

// Share one refresh request when several API calls expire at the same time.
let refreshInFlight$: Observable<RefreshTokenResponse> | null = null;

function refreshSession(
  authService: AuthService,
): Observable<RefreshTokenResponse> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return throwError(() => new Error('Refresh token ausente.'));
  }

  if (!refreshInFlight$) {
    refreshInFlight$ = authService.refreshToken({ refreshToken }).pipe(
      tap((tokens) => {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  return refreshInFlight$;
}

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const path = request.url.replace(/^\//, '');

  // Only public auth calls bypass the token; logout remains authenticated.
  if (PUBLIC_AUTH_ENDPOINTS.has(path)) {
    return next(request);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenUsed = localStorage.getItem('accessToken');

  const returnToLogin = () => {
    clearSession();
    void router.navigate(['/login']);
  };

  const retryWithToken = (accessToken: string) =>
    next(
      request.clone({
        setHeaders: { Authorization: `Bearer ${accessToken}` },
      }),
    );

  const authenticatedRequest = tokenUsed
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${tokenUsed}` },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const latestToken = localStorage.getItem('accessToken');

      // A parallel request may already have refreshed the token.
      if (latestToken && latestToken !== tokenUsed) {
        return retryWithToken(latestToken).pipe(
          catchError((retryError: unknown) => {
            // A request gets one retry only; a second 401 ends this session.
            if (
              retryError instanceof HttpErrorResponse &&
              retryError.status === 401
            ) {
              returnToLogin();
            }
            return throwError(() => retryError);
          }),
        );
      }

      if (!localStorage.getItem('refreshToken')) {
        returnToLogin();
        return throwError(() => error);
      }

      return refreshSession(authService).pipe(
        switchMap((tokens) => retryWithToken(tokens.accessToken)),
        catchError((refreshError: unknown) => {
          // Invalid or expired refresh tokens require a new sign-in.
          if (
            refreshError instanceof HttpErrorResponse &&
            refreshError.status === 401
          ) {
            returnToLogin();
          }
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
