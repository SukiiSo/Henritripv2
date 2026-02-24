import { Routes } from '@angular/router'
import { GuideListPageComponent } from '../features/guides/pages/guide-list-page/guide-list-page.component'
import { GuideDetailPageComponent } from '../features/guides/pages/guide-detail-page/guide-detail-page.component'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'guides' },
  { path: 'guides', component: GuideListPageComponent },
  { path: 'guides/:id', component: GuideDetailPageComponent },
  { path: '**', redirectTo: 'guides' }
]
