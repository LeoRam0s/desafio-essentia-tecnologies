import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RefreshTokenRequest,
  RefreshTokenResponse,
  SigninRequest,
  SigninResponse,
  SignupRequest,
  SignupResponse,
} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authUrl = '/api/auth';

  constructor(private readonly http: HttpClient) {}

  signup(payload: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.authUrl}/signup`, payload);
  }

  signin(payload: SigninRequest): Observable<SigninResponse> {
    return this.http.post<SigninResponse>(`${this.authUrl}/signin`, payload);
  }

  refreshToken(payload: RefreshTokenRequest): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(
      `${this.authUrl}/refresh-token`,
      payload,
    );
  }
}
