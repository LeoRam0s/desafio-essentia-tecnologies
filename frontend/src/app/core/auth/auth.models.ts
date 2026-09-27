export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  name: string;
  email: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
