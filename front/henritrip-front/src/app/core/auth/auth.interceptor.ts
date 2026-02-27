import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AuthService } from './auth.service'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  let requestToSend = req

  if (req.url.includes('/api/')) {
    const authHeader = auth.getAuthHeaderValue()

    if (authHeader) {
      requestToSend = req.clone({ setHeaders: { Authorization: authHeader } })
    } else {
      const userId = auth.getUserId()
      if (userId !== null) {
        requestToSend = req.clone({ setHeaders: { 'X-User-Id': String(userId) } })
      }
    }
  }

  return next(requestToSend).pipe(
    catchError(err => {
      if (err?.status === 401 && !router.url.startsWith('/login')) {
        auth.logout()
        router.navigateByUrl('/login')
      }
      if (err?.status === 403) {
        console.warn('Accès refusé')
      }
      return throwError(() => err)
    })
  )
}
