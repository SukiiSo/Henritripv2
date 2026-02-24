import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environments'

export interface AdminUser {
  id: number
  email: string
  role: 'Admin' | 'User' | string
}

export interface CreateAdminUserRequest {
  email: string
  password: string
  role: 'Admin' | 'User'
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`)
  }

  createUser(payload: CreateAdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.apiUrl}/users`, payload)
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`)
  }
}
