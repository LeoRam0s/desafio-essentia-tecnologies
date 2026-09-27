import { ApiResponseOptions } from '@nestjs/swagger';

export const GetTaskPrioritiesSwagger = {
  summary: 'List task priorities',
  description: 'Returns all available task priorities.',
  okResponse: {
    description: 'Task priorities retrieved successfully.',
    schema: {
      example: [
        {
          taskPriorityId: 1,
          name: 'Low',
          description: 'Low priority task',
        },
        {
          taskPriorityId: 2,
          name: 'Medium',
          description: 'Medium priority task',
        },
        {
          taskPriorityId: 3,
          name: 'High',
          description: 'High priority task',
        },
      ],
    },
  } satisfies ApiResponseOptions,
  unauthorizedResponse: {
    description: 'Missing, malformed, or invalid access token.',
  } satisfies ApiResponseOptions,
};
