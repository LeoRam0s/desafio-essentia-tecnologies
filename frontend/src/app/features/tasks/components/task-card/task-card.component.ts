import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../task.models';

@Component({
  selector: 'app-task-card',
  imports: [],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input({ required: true }) priorityLabel!: string;
  @Input() isOpening = false;

  @Output() edit = new EventEmitter<string>();

  protected isDescriptionVisible = false;

  protected get hasDescription(): boolean {
    return Boolean(this.task.description?.trim());
  }

  protected toggleDescription(): void {
    this.isDescriptionVisible = !this.isDescriptionVisible;
  }

  protected formatDate(value: string, dueDate = false): string {
    const date = dueDate ? new Date(`${value.slice(0, 10)}T12:00:00.000Z`) : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(dueDate ? { timeZone: 'UTC' } : {}),
    }).format(date);
  }
}
