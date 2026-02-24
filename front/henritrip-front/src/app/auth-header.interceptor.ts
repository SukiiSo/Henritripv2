import { HttpInterceptorFn } from '@angular/common/http'

export const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: {
      'X-User-Id': '1' // Simulate a logged-in user with ID 1
    }
  })

  return next(cloned)
}
