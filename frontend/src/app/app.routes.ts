import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { authGuard } from './core/auth/auth.guard';
import { AuthenticatedLayoutComponent } from './core/layout/authenticated-layout/authenticated-layout.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivateChild: [authGuard],
    children: [{ path: 'tasks', component: TasksComponent }],
  },
];
