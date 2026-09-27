import { ApiResponseOptions } from '@nestjs/swagger';

export const UpdateTaskSwagger = {
  summary: 'Update a task',
  description:
    'Updates the provided fields of a task owned by the authenticated user. Changing its status to Completed sets completedAt; leaving Completed clears it.',
  taskIdParam: {
    name: 'taskId',
    description: 'Task unique identifier.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  },
  bodyExample: {
    title: 'Finish project documentation review',
    dueDate: '2026-10-02T12:00:00.000Z',
    taskStatusId: 3,
  },
  okResponse: {
    description: 'Task updated successfully.',
    schema: {
      example: {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Finish project documentation review',
        description: 'Document the authentication flow.',
        userId: 'e3a1b1ca-4326-4bf7-9416-58dbdeb8dd9e',
        taskPriorityId: 2,
        taskStatusId: 3,
        dueDate: '2026-10-02T12:00:00.000Z',
        completedAt: '2026-09-26T12:00:00.000Z',
        createdAt: '2026-09-25T12:00:00.000Z',
        updatedAt: '2026-09-26T12:00:00.000Z',
      },
    },
  } satisfies ApiResponseOptions,
  badRequestResponse: {
    description: 'Invalid task payload.',
  } satisfies ApiResponseOptions,
  unauthorizedResponse: {
    description: 'Missing, malformed, or invalid access token.',
  } satisfies ApiResponseOptions,
  forbiddenResponse: {
    description: 'The task does not belong to the authenticated user.',
  } satisfies ApiResponseOptions,
  notFoundResponse: {
    description: 'The authenticated user or requested task does not exist.',
  } satisfies ApiResponseOptions,
};
