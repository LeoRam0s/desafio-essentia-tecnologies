import { ApiResponseOptions } from '@nestjs/swagger';

export const SignupLocalSwagger = {
  summary: 'Create a new user',
  description:
    'Creates a public local account. The email must be unique and the password is stored with bcrypt.',
  bodyExample: {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    password: 'senha-segura',
  },
  createdResponse: {
    description: 'User created successfully.',
    schema: {
      example: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'João Silva',
        email: 'joao.silva@example.com',
      },
    },
  } satisfies ApiResponseOptions,
  badRequestResponse: {
    description: 'Invalid or missing name, email, or password.',
    schema: {
      example: {
        statusCode: 400,
        message: ['password must be longer than or equal to 6 characters'],
        error: 'Bad Request',
      },
    },
  } satisfies ApiResponseOptions,
  conflictResponse: {
    description: 'Email already exists.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists.',
        error: 'Conflict',
      },
    },
  } satisfies ApiResponseOptions,
};
