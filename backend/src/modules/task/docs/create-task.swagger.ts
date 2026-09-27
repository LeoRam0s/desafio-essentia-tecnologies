import { ApiResponseOptions } from '@nestjs/swagger';

export const CreateTaskSwagger = {
  summary: 'Create a task',
  description:
    'Creates a task for the authenticated user. The task starts with the TO_DO status and no completion date.',
  bodyExample: {
    title: 'Finish project documentation',
    description: 'Document the authentication flow.',
    taskPriorityId: 2,
    dueDate: '2026-10-01T12:00:00.000Z',
  },
  createdResponse: {
    description: 'Task created successfully.',
    schema: {
      example: {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Finish project documentation',
        description: 'Document the authentication flow.',
        userId: 'e3a1b1ca-4326-4bf7-9416-58dbdeb8dd9e',
        taskPriorityId: 2,
        taskStatusId: 1,
        dueDate: '2026-10-01T12:00:00.000Z',
        completedAt: null,
        createdAt: '2026-09-25T12:00:00.000Z',
        updatedAt: '2026-09-25T12:00:00.000Z',
      },
    },
  } satisfies ApiResponseOptions,
  badRequestResponse: {
    description: 'Invalid task payload.',
  } satisfies ApiResponseOptions,
  unauthorizedResponse: {
    description: 'Missing, malformed, or invalid access token.',
  } satisfies ApiResponseOptions,
  notFoundResponse: {
    description: 'The authenticated user no longer exists.',
  } satisfies ApiResponseOptions,
};
