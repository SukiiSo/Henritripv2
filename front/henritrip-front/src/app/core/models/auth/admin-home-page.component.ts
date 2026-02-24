import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-admin-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section style="padding:16px; color:#eef3ff; background:#151c2b; min-height:100vh;">
      <h1>Admin</h1>
      <p>Portail administration</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a routerLink="/admin/users">Gérer les users</a>
        <a routerLink="/admin/guides">Gérer les guides</a>
      </div>
    </section>
  `
})
export class AdminHomePageComponent {}
