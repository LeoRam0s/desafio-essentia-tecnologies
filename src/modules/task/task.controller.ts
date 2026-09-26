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

@ApiTags('Tasks')
@Controller('task')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(private readonly taskService: TaskService) {}

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
    return this.taskService.findOne(taskId, currentUser.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
