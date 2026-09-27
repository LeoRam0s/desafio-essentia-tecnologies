import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CurrentUserDto } from '../auth/dto/current-user.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { TaskService } from './task.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { CreateTaskSwagger } from './docs/create-task.swagger.js';
import { FindAllTasksSwagger } from './docs/find-all-tasks.swagger.js';
import { FindOneTaskSwagger } from './docs/find-one-task.swagger.js';
import { GetTaskPrioritiesSwagger } from './docs/get-task-priorities.swagger.js';
import { GetTaskStatusSwagger } from './docs/get-task-status.swagger.js';
import { UpdateTaskSwagger } from './docs/update-task.swagger.js';
import { RemoveTaskSwagger } from './docs/remove-task.swagger.js';

@ApiTags('Tasks')
@Controller('task')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(private readonly taskService: TaskService) {}

  @Get('status')
  @ApiOperation({
    summary: GetTaskStatusSwagger.summary,
    description: GetTaskStatusSwagger.description,
  })
  @ApiOkResponse(GetTaskStatusSwagger.okResponse)
  @ApiUnauthorizedResponse(GetTaskStatusSwagger.unauthorizedResponse)
  async getTaskStatus() {
    this.logger.debug('Get task status endpoint called');

    return await this.taskService.getTaskStatus();
  }

  @Get('priorities')
  @ApiOperation({
    summary: GetTaskPrioritiesSwagger.summary,
    description: GetTaskPrioritiesSwagger.description,
  })
  @ApiOkResponse(GetTaskPrioritiesSwagger.okResponse)
  @ApiUnauthorizedResponse(GetTaskPrioritiesSwagger.unauthorizedResponse)
  async getTaskPriorities() {
    this.logger.debug('Get task priorities endpoint called');

    return await this.taskService.getTaskPriorities();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: CreateTaskSwagger.summary,
    description: CreateTaskSwagger.description,
  })
  @ApiBody({
    type: CreateTaskDto,
    examples: {
      createTask: {
        summary: 'Valid task payload',
        value: CreateTaskSwagger.bodyExample,
      },
    },
  })
  @ApiCreatedResponse(CreateTaskSwagger.createdResponse)
  @ApiBadRequestResponse(CreateTaskSwagger.badRequestResponse)
  @ApiUnauthorizedResponse(CreateTaskSwagger.unauthorizedResponse)
  @ApiNotFoundResponse(CreateTaskSwagger.notFoundResponse)
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    this.logger.debug('Create task endpoint called');

    return this.taskService.create(createTaskDto, currentUser.userId);
  }

  @Get()
  @ApiOperation({
    summary: FindAllTasksSwagger.summary,
    description: FindAllTasksSwagger.description,
  })
  @ApiOkResponse(FindAllTasksSwagger.okResponse)
  @ApiUnauthorizedResponse(FindAllTasksSwagger.unauthorizedResponse)
  @ApiNotFoundResponse(FindAllTasksSwagger.notFoundResponse)
  findAll(@CurrentUser() currentUser: CurrentUserDto) {
    return this.taskService.findAll(currentUser.userId);
  }

  @Get(':taskId')
  @ApiOperation({
    summary: FindOneTaskSwagger.summary,
    description: FindOneTaskSwagger.description,
  })
  @ApiParam(FindOneTaskSwagger.taskIdParam)
  @ApiOkResponse(FindOneTaskSwagger.okResponse)
  @ApiUnauthorizedResponse(FindOneTaskSwagger.unauthorizedResponse)
  @ApiNotFoundResponse(FindOneTaskSwagger.notFoundResponse)
  findOne(
    @Param('taskId') taskId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    this.logger.debug(`Find one task endpoint called ${taskId}`);

    return this.taskService.findOne(taskId, currentUser.userId);
  }

  @Patch(':taskId')
  @ApiOperation({
    summary: UpdateTaskSwagger.summary,
    description: UpdateTaskSwagger.description,
  })
  @ApiParam(UpdateTaskSwagger.taskIdParam)
  @ApiBody({
    type: UpdateTaskDto,
    examples: {
      updateTask: {
        summary: 'Valid partial task payload',
        value: UpdateTaskSwagger.bodyExample,
      },
    },
  })
  @ApiOkResponse(UpdateTaskSwagger.okResponse)
  @ApiBadRequestResponse(UpdateTaskSwagger.badRequestResponse)
  @ApiUnauthorizedResponse(UpdateTaskSwagger.unauthorizedResponse)
  @ApiForbiddenResponse(UpdateTaskSwagger.forbiddenResponse)
  @ApiNotFoundResponse(UpdateTaskSwagger.notFoundResponse)
  update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    this.logger.debug('Update task endpoint called');

    return this.taskService.update(taskId, updateTaskDto, currentUser.userId);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: RemoveTaskSwagger.summary,
    description: RemoveTaskSwagger.description,
  })
  @ApiParam(RemoveTaskSwagger.taskIdParam)
  @ApiNoContentResponse(RemoveTaskSwagger.noContentResponse)
  @ApiUnauthorizedResponse(RemoveTaskSwagger.unauthorizedResponse)
  @ApiForbiddenResponse(RemoveTaskSwagger.forbiddenResponse)
  @ApiNotFoundResponse(RemoveTaskSwagger.notFoundResponse)
  async remove(
    @Param('taskId') taskId: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    this.logger.debug(`Remove task endpoint called ${taskId}`);

    await this.taskService.remove(taskId, currentUser.userId);
  }
}
