import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

export type FormFieldType = 'text' | 'email' | 'password';
export type FormFieldErrorMessages = Readonly<Record<string, string>>;

@Component({
  selector: 'app-form-field',
  imports: [],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent implements ControlValueAccessor {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  @Input({ required: true }) id!: string;
  @Input({ required: true }) label!: string;
  @Input() type: FormFieldType = 'text';
  @Input() autocomplete?: string;
  @Input() submitted = false;
  @Input() errorMessages: FormFieldErrorMessages = {};
  @Input() externalError: string | null = null;

  protected value = '';
  protected disabled = false;
  protected passwordVisible = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // o input pode ser padrão ou do tipo password
  protected get inputType(): FormFieldType {
    return this.type === 'password' && this.passwordVisible ? 'text' : this.type;
  }

  protected get errorId(): string {
    return `${this.id}-error`;
  }

  protected get errorMessage(): string | null {
    const errors = this.ngControl?.errors;

    if (errors) {
      const errorKey = Object.keys(errors).find((key) => this.errorMessages[key]);

      if (errorKey) {
        return this.errorMessages[errorKey];
      }
    }

    return this.externalError;
  }

  protected get shouldDisplayError(): boolean {
    const control = this.ngControl?.control; // pega o controle do formulário associado ao campo de entrada

    return Boolean(
      this.errorMessage &&
        (control?.invalid || this.externalError) &&
        (this.submitted)
    );
  }

  protected get hasVisibleError(): boolean {
    return this.shouldDisplayError && this.errorMessage !== null;
  }

  writeValue(value: unknown): void {
    this.value = typeof value === 'string' ? value : '';
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.changeDetectorRef.markForCheck();
  }

  protected handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.value = input.value;
    this.onChange(this.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
