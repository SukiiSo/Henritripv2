import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core'
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { timeout, finalize } from 'rxjs'

import { GuideDetail, GuideDay } from '../../../../app/core/models/guide.model'
import { GuidesService } from '../../../../app/core/models/services/services'

@Component({
  selector: 'app-guide-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './guide-detail-page.component.html',
  styleUrl: './guide-detail-page.component.scss'
})
export class GuideDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private guidesService = inject(GuidesService)
  private platformId = inject(PLATFORM_ID)
  private cdr = inject(ChangeDetectorRef)

  guide: GuideDetail | null = null
  loading = false
  errorMessage = ''
  selectedDayId: number | null = null

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return
    }

    const id = Number(this.route.snapshot.paramMap.get('id'))

    if (!id || Number.isNaN(id)) {
      this.errorMessage = 'Identifiant de guide invalide.'
      return
    }

    this.loadGuide(id)
  }

  loadGuide(id: number): void {
    this.loading = true
    this.errorMessage = ''
    this.guide = null
    this.selectedDayId = null

    this.guidesService.getGuideById(id)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.loading = false
          this.cdr.detectChanges()
        })
      )
      .subscribe({
        next: (data: GuideDetail) => {
          console.log('DETAIL OK', data)

          this.guide = data
          this.selectedDayId = data.days?.[0]?.id ?? null

          if (this.isBrowser) {
            try {
              localStorage.setItem(`guide_detail_${id}`, JSON.stringify(data))
            } catch (e) {
              console.warn('Cache localStorage impossible', e)
            }
          }

          this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Erreur détail guide', err)

          if (this.isBrowser) {
            try {
              const cached = localStorage.getItem(`guide_detail_${id}`)

              if (cached) {
                this.guide = JSON.parse(cached) as GuideDetail
                this.selectedDayId = this.guide?.days?.[0]?.id ?? null
                this.errorMessage = 'API indisponible. Détail local affiché.'
                this.cdr.detectChanges()
                return
              }
            } catch (e) {
              console.warn('Lecture cache impossible', e)
            }
          }

          this.errorMessage = 'Impossible de charger ce guide.'
          this.cdr.detectChanges()
        }
      })
  }

  selectDay(day: GuideDay): void {
    this.selectedDayId = day.id
  }

  get selectedDay(): GuideDay | undefined {
    return this.guide?.days?.find(d => d.id === this.selectedDayId)
  }

  trackByDayId(index: number, day: GuideDay): number {
    return day.id
  }

  trackByActivityId(index: number, activity: { id: number }): number {
    return activity.id
  }
}
