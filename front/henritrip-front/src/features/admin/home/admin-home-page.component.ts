import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { pageFadeIn, slideDown, fadeUpSoft } from '../../../app/animations'

@Component({
  selector: 'app-admin-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-home-page.component.html',
  styleUrl: './admin-home-page.component.scss',
  animations: [pageFadeIn, slideDown, fadeUpSoft]
})
export class AdminHomePageComponent {}
