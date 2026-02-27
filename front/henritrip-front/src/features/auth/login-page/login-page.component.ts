import { Component, inject, ChangeDetectorRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService } from '../../../app/core/auth/auth.service'
import { pageFadeIn, slideDown, alertFade } from '../../../app/animations'

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  animations: [pageFadeIn, slideDown, alertFade]
})
export class LoginPageComponent {
  private fb = inject(FormBuilder)
  private auth = inject(AuthService)
  private router = inject(Router)
  private cdr = inject(ChangeDetectorRef)

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
      const emailCtrl = this.form.get('email')
      const pwdCtrl = this.form.get('password')
      if (emailCtrl?.hasError('required') || pwdCtrl?.hasError('required')) {
        this.errorMessage = 'Email et mot de passe obligatoires.'
      } else if (emailCtrl?.hasError('email')) {
        this.errorMessage = 'Veuillez entrer une adresse email valide.'
      } else {
        this.errorMessage = 'Vérifiez les champs du formulaire.'
      }
      this.cdr.markForCheck()
      return
    }

    const email = this.form.value.email ?? ''
    const password = this.form.value.password ?? ''

    this.loading = true

    this.auth.login(email, password).subscribe({
      next: (result) => {
        this.loading = false
        if (!result.ok) {
          this.errorMessage = result.message
          this.cdr.markForCheck()
          return
        }
        this.router.navigateByUrl(this.auth.isAdmin() ? '/admin' : '/guides')
      },
      error: () => {
        this.loading = false
        this.errorMessage = 'Une erreur est survenue. Vérifiez que l\'API est démarrée.'
        this.cdr.markForCheck()
      }
    })
  }
}
