import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import {
  FormFieldComponent,
  FormFieldErrorMessages,
} from '../form-field/form-field.component';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  imports: [FormFieldComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(15),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected hasSubmitted = false;
  protected isLoading = false;
  protected errorMessage: string | null = null;

  protected readonly nameErrorMessages: FormFieldErrorMessages = {
    required: 'Informe seu nome.',
    maxlength: 'O nome deve ter no máximo 100 caracteres.',
  };

  protected readonly emailErrorMessages: FormFieldErrorMessages = {
    required: 'Informe seu e-mail.',
    email: 'Informe um e-mail válido.',
    maxlength: 'O e-mail deve ter no máximo 100 caracteres.',
  };

  protected readonly passwordErrorMessages: FormFieldErrorMessages = {
    required: 'Informe uma senha.',
    minlength: 'A senha deve ter no mínimo 6 caracteres.',
    maxlength: 'A senha deve ter no máximo 15 caracteres.',
  };

  protected readonly confirmPasswordErrorMessages: FormFieldErrorMessages = {
    required: 'Confirme sua senha.',
  };

  protected readonly passwordMismatchMessage = 'As senhas devem ser iguais.';

  protected onSubmit(): void {
    if (this.isLoading) {
      return;
    }

    this.hasSubmitted = true;
    this.errorMessage = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.getRawValue();

    this.isLoading = true;

    this.authService
      .signup({ name, email, password })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/login']),
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.status === 409
              ? 'Este e-mail já está cadastrado.'
              : 'Não foi possível concluir a operação. Tente novamente.';
        },
      });
  }
}
