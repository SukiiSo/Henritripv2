import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section style="padding:16px; color:#eef3ff; background:#151c2b; min-height:100vh;">
      <h1>Admin users</h1>
      <p>Page à brancher sur GET/POST/DELETE /api/users</p>
    </section>
  `
})
export class AdminUsersPageComponent {}
