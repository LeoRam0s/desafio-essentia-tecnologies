import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { clearSession, getSessionUser } from '../../auth/session';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly userName = getSessionUser()?.name ?? '';
  protected isLoggingOut = false;

  protected logout(): void {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    clearSession();
    void this.router.navigate(['/login']);
  }
}
