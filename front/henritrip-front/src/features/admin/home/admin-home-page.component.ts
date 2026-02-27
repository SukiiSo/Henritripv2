import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-admin-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-home-page.component.html',
  styleUrl: './admin-home-page.component.scss'
})
export class AdminHomePageComponent {}
