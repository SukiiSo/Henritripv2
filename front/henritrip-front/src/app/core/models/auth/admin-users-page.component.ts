import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { finalize } from 'rxjs'
import { AdminUsersService, AdminUser } from './admin-users.service'

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section style="padding:16px; color:#eef3ff; background:#0f1a33; min-height:100vh;">
      <h1 style="margin:0 0 8px;">Admin users</h1>
      <p style="margin:0 0 16px; color:#b8c6ea;">Créer, lister et supprimer les utilisateurs.</p>

      <div *ngIf="message" style="margin-bottom:12px; padding:10px 12px; border-radius:10px; border:1px solid #23426a; background:#132644; color:#bcd7ff;">
        {{ message }}
      </div>

      <div *ngIf="errorMessage" style="margin-bottom:12px; padding:10px 12px; border-radius:10px; border:1px solid #6a2323; background:#351818; color:#ffcaca;">
        {{ errorMessage }}
      </div>

      <div style="background:#1b2747; border:1px solid #243864; border-radius:14px; padding:14px; margin-bottom:16px;">
        <h2 style="margin:0 0 12px; font-size:1.05rem;">Créer un utilisateur</h2>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
          <div>
            <label style="display:block; margin-bottom:6px;">Email</label>
            <input
              [(ngModel)]="form.email"
              type="email"
              placeholder="user@henritrip.test"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;"
            />
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Mot de passe</label>
            <input
              [(ngModel)]="form.password"
              type="text"
              placeholder="motdepasse"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;"
            />
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Rôle</label>
            <select
              [(ngModel)]="form.role"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
          <button
            type="button"
            (click)="createUser()"
            [disabled]="saving"
            style="border-radius:10px; border:1px solid #4b79d2; background:#2f62c9; color:white; padding:8px 12px; cursor:pointer;"
          >
            {{ saving ? 'Création...' : 'Créer user' }}
          </button>

          <button
            type="button"
            (click)="resetForm()"
            style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:8px 12px; cursor:pointer;"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
        <h2 style="margin:0; font-size:1.05rem;">Liste des users</h2>
        <button
          type="button"
          (click)="loadUsers()"
          [disabled]="loading"
          style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:8px 12px; cursor:pointer;"
        >
          {{ loading ? 'Chargement...' : 'Rafraîchir' }}
        </button>
      </div>

      <div style="background:#1b2747; border:1px solid #243864; border-radius:14px; overflow:hidden;">
        <div *ngIf="loading" style="padding:14px;">Chargement...</div>

        <div *ngIf="!loading && users.length === 0" style="padding:14px;">
          Aucun utilisateur.
        </div>

        <table *ngIf="!loading && users.length > 0" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#16223f;">
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">ID</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">Email</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">Rôle</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users; trackBy: trackByUserId" style="border-bottom:1px solid #223357;">
              <td style="padding:10px;">{{ user.id }}</td>
              <td style="padding:10px;">{{ user.email }}</td>
              <td style="padding:10px;">{{ user.role }}</td>
              <td style="padding:10px;">
                <button
                  type="button"
                  (click)="deleteUser(user)"
                  [disabled]="deletingIds.has(user.id)"
                  style="border-radius:10px; border:1px solid #7a3434; background:#441f1f; color:#ffd6d6; padding:6px 10px; cursor:pointer;"
                >
                  {{ deletingIds.has(user.id) ? 'Suppression...' : 'Supprimer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
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
    if (this.loading) return

    this.errorMessage = ''
    this.message = ''
    this.loading = true
    this.cdr.detectChanges()

    this.adminUsersService.getUsers()
      .pipe(
        finalize(() => {
          this.loading = false
          this.cdr.detectChanges()
        })
      )
      .subscribe({
        next: (users: AdminUser[]) => {
          this.users = [...(users ?? [])]
          this.cdr.detectChanges()
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de charger les utilisateurs.'
          this.cdr.detectChanges()
        }
      })
  }

  createUser(): void {
    this.errorMessage = ''
    this.message = ''

    if (!this.form.email.trim() || !this.form.password.trim()) {
      this.errorMessage = 'Email et mot de passe obligatoires.'
      this.cdr.detectChanges()
      return
    }

    this.saving = true
    this.cdr.detectChanges()

    this.adminUsersService.createUser({
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      role: this.form.role
    })
      .pipe(
        finalize(() => {
          this.saving = false
          this.cdr.detectChanges()
        })
      )
      .subscribe({
        next: () => {
          this.message = 'Utilisateur créé.'
          this.resetForm()
          this.loadUsers()
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de créer l utilisateur.'
          this.cdr.detectChanges()
        }
      })
  }

  deleteUser(user: AdminUser): void {
    this.errorMessage = ''
    this.message = ''

    const ok = confirm(`Supprimer l'utilisateur ${user.email} ?`)
    if (!ok) return

    this.deletingIds.add(user.id)
    this.cdr.detectChanges()

    this.adminUsersService.deleteUser(user.id)
      .pipe(
        finalize(() => {
          this.deletingIds.delete(user.id)
          this.cdr.detectChanges()
        })
      )
      .subscribe({
        next: () => {
          this.message = 'Utilisateur supprimé.'
          this.users = this.users.filter(u => u.id !== user.id)
          this.cdr.detectChanges()
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de supprimer l utilisateur.'
          this.cdr.detectChanges()
        }
      })
  }

  resetForm(): void {
    this.form = {
      email: '',
      password: '',
      role: 'User'
    }
    this.cdr.detectChanges()
  }
}
