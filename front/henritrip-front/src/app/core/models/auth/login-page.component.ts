import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService } from './auth.service'

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private fb = inject(FormBuilder)
  private auth = inject(AuthService)
  private router = inject(Router)

  errorMessage = ''
  loading = false

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  })

  quickLogin(type: 'admin' | 'alice' | 'bob'): void {
    const presets = {
      admin: { email: 'admin@henritrip.test', password: 'admin123' },
      alice: { email: 'alice@henritrip.test', password: 'alice123' },
      bob: { email: 'bob@henritrip.test', password: 'bob123' }
    }

    this.form.patchValue(presets[type])
    this.submit()
  }

  submit(): void {
    this.errorMessage = ''

    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const email = this.form.value.email ?? ''
    const password = this.form.value.password ?? ''

    this.loading = true

    this.auth.login(email, password).subscribe(result => {
      this.loading = false

      if (!result.ok) {
        this.errorMessage = result.message
        return
      }

      if (this.auth.isAdmin()) {
        this.router.navigateByUrl('/admin')
        return
      }

      this.router.navigateByUrl('/guides')
    })
  }
}
