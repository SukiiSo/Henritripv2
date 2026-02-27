import { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { adminGuard } from './core/auth/admin.guard'
import { LoginPageComponent } from '../features/auth/login-page/login-page.component'
import { GuideListPageComponent } from '../features/guides/pages/guide-list-page/guide-list-page.component'
import { GuideDetailPageComponent } from '../features/guides/pages/guide-detail-page/guide-detail-page.component'

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'guides'
  },
  {
    path: 'guides',
    canActivate: [authGuard],
    component: GuideListPageComponent
  },
  {
    path: 'guides/:id',
    canActivate: [authGuard],
    component: GuideDetailPageComponent
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('../features/admin/home/admin-home-page.component').then(m => m.AdminHomePageComponent)
  },
  {
    path: 'admin/users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('../features/admin/users/admin-users-page.component').then(m => m.AdminUsersPageComponent)
  },
  {
    path: 'admin/guides',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('../features/admin/guides/admin-guides-page.component').then(m => m.AdminGuidesPageComponent)
  },
  {
    path: '**',
    redirectTo: 'guides'
  }
]
