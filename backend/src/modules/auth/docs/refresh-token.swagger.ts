import { ApiResponseOptions } from '@nestjs/swagger';

export const RefreshTokenSwagger = {
  summary: 'Rotate refresh token',
  description: 'Rotates a valid refresh token and returns a new token pair.',
  bodyExample: {
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
  },
  okResponse: {
    description: 'Refresh token rotated successfully.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
      },
    },
  } satisfies ApiResponseOptions,
  badRequestResponse: {
    description: 'Invalid or missing refresh token payload.',
    schema: {
      example: {
        statusCode: 400,
        message: ['refreshToken must be a JWT string'],
        error: 'Bad Request',
      },
    },
  } satisfies ApiResponseOptions,
  unauthorizedResponse: {
    description: 'Invalid, expired, revoked, or mismatched refresh token.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid refresh token.',
        error: 'Unauthorized',
      },
    },
  } satisfies ApiResponseOptions,
};
