import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environments'
import { Guide, GuideDetail } from '../guide.model'

export interface CreateGuideRequest {
  title: string
  description: string
  numberOfDays: number
  mobility: string
  season: string
  forWho: string
  destination?: string | null
  coverImageUrl?: string | null
}

export interface UpdateGuideRequest extends CreateGuideRequest {}

export interface UpdateGuideDayRequest {
  title: string
  date?: string | null
}

export interface CreateInvitationRequest {
  userId: number
}

export interface CreateActivityRequest {
  title: string
  description: string
  category: string
  address: string
  phoneNumber?: string | null
  openingHours?: string | null
  website?: string | null
  startTime?: string | null
  endTime?: string | null
  forWho: string
  visitOrder?: number | null
}

export interface UpdateActivityRequest extends CreateActivityRequest {}

@Injectable({
  providedIn: 'root'
})
export class AdminGuidesService {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  getGuides(search?: string): Observable<Guide[]> {
    let params = new HttpParams()
    if (search?.trim()) {
      params = params.set('search', search.trim())
    }

    return this.http.get<Guide[]>(`${this.apiUrl}/guides`, { params })
  }

  getGuideById(id: number): Observable<GuideDetail> {
    return this.http.get<GuideDetail>(`${this.apiUrl}/guides/${id}`)
  }

  createGuide(payload: CreateGuideRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/guides`, payload)
  }

  updateGuide(id: number, payload: UpdateGuideRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/guides/${id}`, payload)
  }

  deleteGuide(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/guides/${id}`)
  }

  inviteUser(guideId: number, userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/guides/${guideId}/invitations`,
      { userId } satisfies CreateInvitationRequest
    )
  }

  removeInvitation(guideId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/guides/${guideId}/invitations/${userId}`)
  }

  updateGuideDay(
    guideId: number,
    dayId: number,
    payload: UpdateGuideDayRequest
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/guides/${guideId}/days/${dayId}`,
      payload
    )
  }

  createActivity(
    guideId: number,
    dayId: number,
    payload: CreateActivityRequest
  ): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.apiUrl}/guides/${guideId}/days/${dayId}/activities`,
      payload
    )
  }

  updateActivity(
    guideId: number,
    dayId: number,
    activityId: number,
    payload: UpdateActivityRequest
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/guides/${guideId}/days/${dayId}/activities/${activityId}`,
      payload
    )
  }

  deleteActivity(guideId: number, dayId: number, activityId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/guides/${guideId}/days/${dayId}/activities/${activityId}`
    )
  }
}
