import { Component, inject } from '@angular/core'
import { RouterOutlet, RouterLink, Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AuthService } from './core/auth/auth.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  auth = inject(AuthService)
  private router = inject(Router)

  logout(): void {
    this.auth.logout()
    this.router.navigateByUrl('/login')
  }
}
