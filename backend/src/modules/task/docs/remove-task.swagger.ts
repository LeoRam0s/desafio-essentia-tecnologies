import { ApiResponseOptions } from '@nestjs/swagger';

export const RemoveTaskSwagger = {
  summary: 'Delete a task',
  description: 'Deletes a task owned by the authenticated user.',
  taskIdParam: {
    name: 'taskId',
    description: 'Task unique identifier.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  },
  noContentResponse: {
    description: 'Task deleted successfully.',
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
