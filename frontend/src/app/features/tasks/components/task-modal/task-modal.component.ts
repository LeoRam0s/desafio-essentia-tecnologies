import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Task, TaskPriority, TaskPriorityId, TaskStatus, TaskStatusId } from '../../task.models';

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function notBeforeToday(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value;
  return value && value < localDateString(new Date())
    ? { dateInPast: true }
    : null;
}

export interface TaskFormValues {
  title: string;
  description: string;
  taskPriorityId: TaskPriorityId;
  dueDate: string;
  taskStatusId: TaskStatusId;
}

@Component({
  selector: 'app-task-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './task-modal.component.html',
  styleUrl: './task-modal.component.scss',
})
export class TaskModalComponent implements OnChanges, AfterViewInit {
  @ViewChild('taskDialog', { static: true }) private taskDialog!: ElementRef<HTMLDialogElement>;

  @Input() task: Task | null = null;
  @Input() open = false;
  @Input({ required: true }) priorities: TaskPriority[] = [];
  @Input({ required: true }) statuses: TaskStatus[] = [];
  @Input() isSaving = false;
  @Input() error: string | null = null;

  @Output() submit = new EventEmitter<TaskFormValues>();
  @Output() closeRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();

  private readonly formBuilder = inject(FormBuilder);
  protected isConfirmingDelete = false;

  protected get todayDate(): string {
    return localDateString(new Date());
  }

  protected readonly taskForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    taskPriorityId: [2 as TaskPriorityId, Validators.required],
    dueDate: ['', notBeforeToday],
    taskStatusId: [1 as TaskStatusId, Validators.required],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) return;

    if (this.open) {
      this.isConfirmingDelete = false;
      this.taskForm.reset({
        title: this.task?.title ?? '',
        description: this.task?.description ?? '',
        taskPriorityId: this.task?.taskPriorityId ?? 2,
        dueDate: this.task?.dueDate?.slice(0, 10) ?? '',
        taskStatusId: this.task?.taskStatusId ?? 1,
      });
    } else {
      this.isConfirmingDelete = false;
    }
    this.syncDialog();
  }

  ngAfterViewInit(): void {
    this.syncDialog();
  }

  protected onSubmit(event: Event): void {
    event.stopPropagation();
    if (this.isSaving) return;
    this.taskForm.controls.dueDate.updateValueAndValidity();
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const values = this.taskForm.getRawValue();
    if (!values.title.trim()) {
      this.taskForm.controls.title.setErrors({ required: true });
      this.taskForm.controls.title.markAsTouched();
      return;
    }

    this.submit.emit(values);
  }

  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    if (!this.isSaving) this.closeRequested.emit();
  }

  protected cancelDelete(): void {
    if (!this.isSaving) this.isConfirmingDelete = false;
  }

  private syncDialog(): void {
    if (!this.taskDialog) return;
    const dialog = this.taskDialog.nativeElement;
    if (this.open && !dialog.open) dialog.showModal();
    if (!this.open && dialog.open) dialog.close();
  }
}
