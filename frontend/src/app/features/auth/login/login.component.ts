import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SigninResponse } from '../../../core/auth/auth.models';
import {
  FormFieldComponent,
  FormFieldErrorMessages,
} from '../form-field/form-field.component';

@Component({
  selector: 'app-login',
  imports: [FormFieldComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(100)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(15)],
    ],
  });

  protected hasSubmitted = false;
  protected isLoading = false;
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;

  protected readonly emailErrorMessages: FormFieldErrorMessages = {
    required: 'Informe seu e-mail.',
    email: 'Informe um e-mail válido.',
    maxlength: 'O e-mail deve ter no máximo 100 caracteres.',
  };

  protected readonly passwordErrorMessages: FormFieldErrorMessages = {
    required: 'Informe sua senha.',
    minlength: 'A senha deve ter no mínimo 6 caracteres.',
    maxlength: 'A senha deve ter no máximo 15 caracteres.',
  };

  protected onSubmit(): void {
    if (this.isLoading) {
      return;
    }

    this.hasSubmitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService
      .signin(this.loginForm.getRawValue())
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.storeSession(response);
          this.successMessage = 'Login realizado com sucesso.';
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.status === 401
              ? 'E-mail ou senha inválidos.'
              : 'Não foi possível concluir a operação. Tente novamente.';
        },
      });
  }

  private storeSession(response: SigninResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
}
