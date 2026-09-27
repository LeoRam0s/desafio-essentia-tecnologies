import { ApiResponseOptions } from '@nestjs/swagger';

export const GetTaskStatusSwagger = {
  summary: 'List task statuses',
  description: 'Returns all available task statuses.',
  okResponse: {
    description: 'Task statuses retrieved successfully.',
    schema: {
      example: [
        {
          taskStatusId: 1,
          name: 'To do',
          description: 'Task waiting to be started',
        },
        {
          taskStatusId: 2,
          name: 'Doing',
          description: 'Task currently in progress',
        },
        {
          taskStatusId: 3,
          name: 'Completed',
          description: 'Task has been completed',
        },
      ],
    },
  } satisfies ApiResponseOptions,
  unauthorizedResponse: {
    description: 'Missing, malformed, or invalid access token.',
  } satisfies ApiResponseOptions,
};
