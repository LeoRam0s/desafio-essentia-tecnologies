import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import {
  CreateTaskPayload,
  Task,
  TaskDetails,
  TaskPriority,
  TaskPriorityId,
  TaskStatus,
  TaskStatusId,
  UpdateTaskPayload,
} from './task.models';
import { TaskService } from './task.service';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { TaskFormValues, TaskModalComponent } from './components/task-modal/task-modal.component';

const DEFAULT_PRIORITIES: TaskPriority[] = [
  { taskPriorityId: 1, name: 'Low', description: '' },
  { taskPriorityId: 2, name: 'Medium', description: '' },
  { taskPriorityId: 3, name: 'High', description: '' },
];

const DEFAULT_STATUSES: TaskStatus[] = [
  { taskStatusId: 1, name: 'To do', description: '' },
  { taskStatusId: 2, name: 'Doing', description: '' },
  { taskStatusId: 3, name: 'Completed', description: '' },
];

type TaskSortField = 'priority' | 'dueDate' | 'completedAt';
type SortDirection = 'asc' | 'desc';

interface ColumnSort {
  field: TaskSortField;
  direction: SortDirection;
}

interface SortOption {
  field: TaskSortField;
  label: string;
}

// Cada coluna de status tem suas próprias opções de ordenação.
const SORT_OPTIONS: Record<TaskStatusId, SortOption[]> = {
  1: [
    { field: 'priority', label: 'Prioridade' },
    { field: 'dueDate', label: 'Data de vencimento' },
  ],
  2: [
    { field: 'priority', label: 'Prioridade' },
    { field: 'dueDate', label: 'Data de vencimento' },
  ],
  3: [
    { field: 'priority', label: 'Prioridade' },
    { field: 'dueDate', label: 'Data de vencimento' },
    { field: 'completedAt', label: 'Data de conclusão' },
  ],
};

@Component({
  selector: 'app-tasks',
  imports: [TaskCardComponent, TaskModalComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  protected readonly columns = DEFAULT_STATUSES;
  protected readonly sortOptionsByStatus = SORT_OPTIONS;
  // Cada coluna mantém seu próprio critério e direção de ordenação.
  protected sortByStatus: Record<TaskStatusId, ColumnSort> = {
    1: { field: 'priority', direction: 'asc' },
    2: { field: 'priority', direction: 'asc' },
    3: { field: 'priority', direction: 'asc' },
  };
  protected priorities = DEFAULT_PRIORITIES;
  protected statuses = DEFAULT_STATUSES;
  protected tasksByStatus: Record<TaskStatusId, Task[]> = { 1: [], 2: [], 3: [] };
  protected isLoading = false;
  protected isSaving = false;
  protected openingTaskId: string | null = null;
  protected loadError: string | null = null;
  protected modalError: string | null = null;
  protected selectedTask: TaskDetails | null = null;
  protected isModalOpen = false;

  ngOnInit(): void {
    this.loadTasks();
    this.taskService.getPriorities().subscribe({
      next: (priorities) => {
        const known = priorities
          .filter((priority) => [1, 2, 3].includes(priority.taskPriorityId))
          .sort((a, b) => a.taskPriorityId - b.taskPriorityId);
        if (known.length === 3) this.priorities = known;
      },
      error: () => undefined,
    });
    this.taskService.getStatuses().subscribe({
      next: (statuses) => {
        const known = statuses
          .filter((status) => [1, 2, 3].includes(status.taskStatusId))
          .sort((a, b) => a.taskStatusId - b.taskStatusId);
        if (known.length === 3) this.statuses = known;
      },
      error: () => undefined,
    });
  }

  protected loadTasks(): void {
    this.isLoading = true;
    this.loadError = null;
    this.taskService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (tasks) => {
          const grouped: Record<TaskStatusId, Task[]> = { 1: [], 2: [], 3: [] };
          for (const task of tasks) {
            if (task.taskStatusId in grouped) {
              grouped[task.taskStatusId].push(task);
            }
          }
          this.tasksByStatus = grouped;
        },
        error: () => {
          this.loadError = 'Não foi possível carregar suas tarefas.';
        },
      });
  }

  protected openCreate(): void {
    this.selectedTask = null;
    this.modalError = null;
    this.isModalOpen = true;
  }

  protected openEdit(taskId: string): void {
    if (this.openingTaskId) return;
    this.openingTaskId = taskId;
    this.loadError = null;
    this.taskService
      .findOne(taskId)
      .pipe(finalize(() => (this.openingTaskId = null)))
      .subscribe({
        next: (task) => {
          this.selectedTask = task;
          this.modalError = null;
          this.isModalOpen = true;
        },
        error: () => {
          this.loadError = 'Não foi possível abrir esta tarefa.';
        },
      });
  }

  protected onSubmit(values: TaskFormValues): void {
    if (this.isSaving) return;

    this.modalError = null;
    const payload: CreateTaskPayload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      taskPriorityId: values.taskPriorityId,
      dueDate: values.dueDate ? `${values.dueDate}T12:00:00.000Z` : null,
    };

    const current = this.selectedTask;
    if (!current) {
      this.save(this.taskService.create(payload));
      return;
    }

    const changes: UpdateTaskPayload = {};
    if (payload.title !== current.title) changes.title = payload.title;
    if (payload.description !== current.description) {
      changes.description = payload.description;
    }
    if (payload.taskPriorityId !== current.taskPriorityId) {
      changes.taskPriorityId = payload.taskPriorityId;
    }
    if (values.dueDate !== (current.dueDate?.slice(0, 10) ?? '')) {
      changes.dueDate = payload.dueDate;
    }
    if (values.taskStatusId !== current.taskStatusId) {
      changes.taskStatusId = values.taskStatusId;
    }

    if (Object.keys(changes).length === 0) {
      this.closeModal();
      return;
    }
    this.save(this.taskService.update(current.taskId, changes));
  }

  protected removeTask(): void {
    const task = this.selectedTask;
    if (!task || this.isSaving) return;

    this.isSaving = true;
    this.modalError = null;
    this.taskService
      .remove(task.taskId)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.isModalOpen = false;
          this.selectedTask = null;
          this.modalError = null;
          this.loadTasks();
        },
        error: () => {
          this.modalError = 'Não foi possível remover a tarefa.';
        },
      });
  }

  protected closeModal(): void {
    if (!this.isSaving) this.isModalOpen = false;
  }

  protected priorityName(id: TaskPriorityId): string {
    return DEFAULT_PRIORITIES.find((priority) => priority.taskPriorityId === id)?.name ?? '';
  }

  protected changeSortField(taskStatusId: TaskStatusId, event: Event): void {
    const field = (event.target as HTMLSelectElement).value as TaskSortField;
    // Garante que a coluna só use campos oferecidos nas opções daquela coluna.
    if (!this.sortOptionsByStatus[taskStatusId].some((option) => option.field === field)) {
      return;
    }

    this.sortByStatus = {
      ...this.sortByStatus,
      [taskStatusId]: { ...this.sortByStatus[taskStatusId], field },
    };
  }

  protected toggleSortDirection(taskStatusId: TaskStatusId): void {
    const current = this.sortByStatus[taskStatusId];
    this.sortByStatus = {
      ...this.sortByStatus,
      [taskStatusId]: {
        ...current,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      },
    };
  }

  protected sortedTasks(taskStatusId: TaskStatusId): Task[] {
    const { field, direction } = this.sortByStatus[taskStatusId];

    // Ordena uma cópia para preservar a lista agrupada usada como fonte.
    return [...this.tasksByStatus[taskStatusId]].sort((a, b) => {
      const aValue = this.sortValue(a, field);
      const bValue = this.sortValue(b, field);

      // Valores ausentes ficam no fim, independentemente da direção.
      if (aValue === null) return bValue === null ? 0 : 1;
      if (bValue === null) return -1;

      const comparison = aValue - bValue;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  private sortValue(task: Task, field: TaskSortField): number | null {
    if (field === 'priority') return task.taskPriorityId;

    const date = field === 'dueDate' ? task.dueDate : task.completedAt;
    if (!date) return null;

    const timestamp = Date.parse(date);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  private save(request: ReturnType<TaskService['create']>): void {
    this.isSaving = true;
    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.isModalOpen = false;
        this.loadTasks();
      },
      error: () => {
        this.modalError = 'Não foi possível salvar a tarefa. Tente novamente.';
      },
    });
  }
}
