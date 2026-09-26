import { ApiResponseOptions } from '@nestjs/swagger';

export const SigninLocalSwagger = {
  summary: 'Sign in with a local account',
  description:
    'Authenticates a local account and returns access and refresh tokens.',
  bodyExample: {
    email: 'joao.silva@example.com',
    password: 'senha-segura',
  },
  okResponse: {
    description: 'User signed in successfully.',
    schema: {
      example: {
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'João Silva',
          email: 'joao.silva@example.com',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
      },
    },
  } satisfies ApiResponseOptions,
  badRequestResponse: {
    description: 'Invalid or missing email or password.',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      },
    },
  } satisfies ApiResponseOptions,
  unauthorizedResponse: {
    description: 'Invalid credentials.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials.',
        error: 'Unauthorized',
      },
    },
  } satisfies ApiResponseOptions,
};
