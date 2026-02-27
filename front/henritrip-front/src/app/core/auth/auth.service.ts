import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of, tap, catchError, map } from 'rxjs'
import { environment } from '../../../environments/environments'

export type AppRole = 'Admin' | 'User'

export interface AuthUser {
  id: number
  email: string
  role: AppRole
}

interface LoginApiResponse {
  token: string
  user: AuthUser
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient)

  private readonly STORAGE_USER_KEY = 'henritrip_auth_user'
  private readonly STORAGE_TOKEN_KEY = 'henritrip_auth_token'
  private readonly apiUrl = environment.apiUrl

  private currentUserSignal = signal<AuthUser | null>(this.readUserFromStorage())

  currentUser = computed(() => this.currentUserSignal())
  isLoggedIn = computed(() => this.currentUserSignal() !== null)
  isAdmin = computed(() => this.currentUserSignal()?.role === 'Admin')

  login(email: string, password: string): Observable<{ ok: true } | { ok: false; message: string }> {
    return this.http.post<LoginApiResponse>(`${this.apiUrl}/auth/login`, { email: email.trim(), password: password.trim() }).pipe(
      tap((res) => {
        this.currentUserSignal.set(res.user)
        localStorage.setItem(this.STORAGE_USER_KEY, JSON.stringify(res.user))
        localStorage.setItem(this.STORAGE_TOKEN_KEY, res.token)
      }),
      map(() => ({ ok: true as const })),
      catchError((err) => {
        const msg = err?.error?.message
        const message = msg && typeof msg === 'string'
          ? msg
          : err?.status === 401
            ? 'Identifiants invalides.'
            : err?.status === 400
              ? 'Email et mot de passe obligatoires.'
              : 'Impossible de se connecter. Vérifiez votre connexion.'
        return of({ ok: false as const, message })
      })
    )
  }

  restoreSession(): Observable<boolean> {
    if (!this.getToken()) return of(false)

    return this.http.get<AuthUser>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this.currentUserSignal.set(user)
        localStorage.setItem(this.STORAGE_USER_KEY, JSON.stringify(user))
      }),
      map(() => true),
      catchError(() => {
        this.clearLocalSession()
        return of(false)
      })
    )
  }

  logout(): void {
    const token = this.getToken()
    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe()
    }
    this.clearLocalSession()
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSignal()
  }

  getUserId(): number | null {
    return this.currentUserSignal()?.id ?? null
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_TOKEN_KEY)
    } catch {
      return null
    }
  }

  getAuthHeaderValue(): string | null {
    const token = this.getToken()
    return token ? `Bearer ${token}` : null
  }

  private clearLocalSession(): void {
    this.currentUserSignal.set(null)
    try {
      localStorage.removeItem(this.STORAGE_USER_KEY)
      localStorage.removeItem(this.STORAGE_TOKEN_KEY)
    } catch {}
  }

  private readUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_USER_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AuthUser
      if (!parsed?.id || !parsed?.email || !parsed?.role) return null
      return parsed
    } catch {
      return null
    }
  }
}
