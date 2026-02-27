import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { finalize, take, timeout } from 'rxjs'
import { AdminUsersService, AdminUser } from '../../../app/core/services/admin-users.service'

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss'
})
export class AdminUsersPageComponent implements OnInit {
  private adminUsersService = inject(AdminUsersService)
  private cdr = inject(ChangeDetectorRef)

  users: AdminUser[] = []

  loading = false
  saving = false
  deletingIds = new Set<number>()

  errorMessage = ''
  message = ''

  form = {
    email: '',
    password: '',
    role: 'User' as 'Admin' | 'User'
  }

  ngOnInit(): void {
    this.loadUsers()
  }

  trackByUserId(_: number, user: AdminUser): number {
    return user.id
  }

  loadUsers(): void {
    this.errorMessage = ''
    this.message = ''
    this.loading = true
    this.cdr.markForCheck()

    this.adminUsersService.getUsers()
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.loading = false
          this.cdr.markForCheck()
        })
      )
      .subscribe({
        next: (users: AdminUser[]) => {
          this.users = [...(users ?? [])]
        },
        error: (err: unknown) => {
          this.loading = false
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? (err as Error)?.message ?? 'Impossible de charger les utilisateurs.'
          this.cdr.markForCheck()
        }
      })
  }

  createUser(): void {
    this.errorMessage = ''
    this.message = ''

    if (!this.form.email.trim() || !this.form.password.trim()) {
      this.errorMessage = 'Email et mot de passe obligatoires.'
      return
    }

    this.saving = true

    this.adminUsersService.createUser({
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      role: this.form.role
    })
      .pipe(finalize(() => { this.saving = false }))
      .subscribe({
        next: () => {
          this.message = 'Utilisateur créé.'
          this.resetForm()
          this.loadUsers()
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? 'Impossible de créer l\'utilisateur.'
        }
      })
  }

  deleteUser(user: AdminUser): void {
    this.errorMessage = ''
    this.message = ''

    if (!confirm(`Supprimer l'utilisateur ${user.email} ?`)) return

    this.deletingIds.add(user.id)

    this.adminUsersService.deleteUser(user.id)
      .pipe(finalize(() => { this.deletingIds.delete(user.id) }))
      .subscribe({
        next: () => {
          this.message = 'Utilisateur supprimé.'
          this.users = this.users.filter(u => u.id !== user.id)
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? 'Impossible de supprimer l\'utilisateur.'
        }
      })
  }

  resetForm(): void {
    this.form = { email: '', password: '', role: 'User' }
  }
}
