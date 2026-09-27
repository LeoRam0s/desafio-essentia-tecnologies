import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTaskPayload,
  Task,
  TaskDetails,
  TaskPriority,
  TaskStatus,
  UpdateTaskPayload,
} from './task.models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/task';

  create(payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(this.url, payload);
  }

  findAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.url);
  }

  findOne(taskId: string): Observable<TaskDetails> {
    return this.http.get<TaskDetails>(`${this.url}/${encodeURIComponent(taskId)}`);
  }

  update(taskId: string, payload: UpdateTaskPayload): Observable<Task> {
    return this.http.patch<Task>(`${this.url}/${encodeURIComponent(taskId)}`, payload);
  }

  remove(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(taskId)}`);
  }

  getPriorities(): Observable<TaskPriority[]> {
    return this.http.get<TaskPriority[]>(`${this.url}/priorities`);
  }

  getStatuses(): Observable<TaskStatus[]> {
    return this.http.get<TaskStatus[]>(`${this.url}/status`);
  }
}
