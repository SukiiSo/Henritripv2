import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core'
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { ActivatedRoute, RouterLink } from '@angular/router'
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

  guide: GuideDetail | null = null
  loading = false
  errorMessage = ''
  selectedDayId: number | null = null

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }

  ngOnInit(): void {
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

    this.guidesService.getGuideById(id).subscribe({
      next: (data: GuideDetail) => {
        this.guide = data
        this.selectedDayId = data.days?.[0]?.id ?? null
        this.loading = false

        if (this.isBrowser) {
          localStorage.setItem(`guide_detail_${id}`, JSON.stringify(data))
        }
      },
      error: () => {
        if (this.isBrowser) {
          const cached = localStorage.getItem(`guide_detail_${id}`)

          if (cached) {
            this.guide = JSON.parse(cached) as GuideDetail
            this.selectedDayId = this.guide?.days?.[0]?.id ?? null
            this.errorMessage = 'API indisponible. Détail local affiché.'
          } else {
            this.errorMessage = 'Impossible de charger ce guide.'
          }
        } else {
          this.errorMessage = 'Impossible de charger ce guide.'
        }

        this.loading = false
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
