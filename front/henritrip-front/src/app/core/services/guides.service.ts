import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environments'
import { Guide, GuideDetail } from '../models/guide.model'

@Injectable({ providedIn: 'root' })
export class GuidesService {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  getGuides(search?: string): Observable<Guide[]> {
    let params = new HttpParams()
    if (search?.trim()) params = params.set('search', search.trim())
    return this.http.get<Guide[]>(`${this.apiUrl}/guides`, { params })
  }

  getGuideById(id: number): Observable<GuideDetail> {
    return this.http.get<GuideDetail>(`${this.apiUrl}/guides/${id}`)
  }
}
