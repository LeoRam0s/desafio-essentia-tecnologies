import { ApiResponseOptions } from '@nestjs/swagger';

export const FindAllTasksSwagger = {
  summary: 'List authenticated user tasks',
  description: 'Returns all tasks owned by the authenticated user.',
  okResponse: {
    description: 'Tasks retrieved successfully.',
    schema: {
      example: [
        {
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
      ],
    },
  } satisfies ApiResponseOptions,
  unauthorizedResponse: {
    description: 'Missing, malformed, or invalid access token.',
  } satisfies ApiResponseOptions,
  notFoundResponse: {
    description: 'The authenticated user no longer exists.',
  } satisfies ApiResponseOptions,
};
