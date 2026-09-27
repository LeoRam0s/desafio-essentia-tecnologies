export type TaskStatusId = 1 | 2 | 3;
export type TaskPriorityId = 1 | 2 | 3;

export interface Task {
  taskId: string;
  title: string;
  description: string | null;
  userId: string;
  taskPriorityId: TaskPriorityId;
  taskStatusId: TaskStatusId;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskHistoryStatus = 'TO_DO' | 'DOING' | 'COMPLETED';

export interface TaskHistoryEvent {
  status: TaskHistoryStatus;
  changedAt: string;
}

export interface TaskDetails extends Task {
  history: TaskHistoryEvent[];
}

export interface TaskPriority {
  taskPriorityId: TaskPriorityId;
  name: string;
  description: string;
}

export interface TaskStatus {
  taskStatusId: TaskStatusId;
  name: string;
  description: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string | null;
  taskPriorityId: TaskPriorityId;
  dueDate: string | null;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload & { taskStatusId: TaskStatusId }>;
