import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core'
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { Subject, debounceTime, distinctUntilChanged, timeout, finalize, takeUntil } from 'rxjs'

import { Guide } from '../../../../app/core/models/guide.model'
import { GuidesService } from '../../../../app/core/models/services/services'

@Component({
  selector: 'app-guide-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './guide-list-page.component.html',
  styleUrl: './guide-list-page.component.scss'
})
export class GuideListPageComponent implements OnInit, OnDestroy {
  private guidesService = inject(GuidesService)
  private platformId = inject(PLATFORM_ID)
  private cdr = inject(ChangeDetectorRef)

  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  guides: Guide[] = []
  filteredGuides: Guide[] = []

  loading = false
  errorMessage = ''
  searchTerm = ''

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return
    }

    this.loadGuides()

    this.searchSubject
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilter()
        this.cdr.detectChanges()
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadGuides(): void {
    this.loading = true
    this.errorMessage = ''

    this.guidesService.getGuides()
      .pipe(
        timeout(8000),
        finalize(() => {
          this.loading = false
          this.cdr.detectChanges()
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: Guide[]) => {
          console.log('GUIDES OK', data)

          this.guides = data ?? []
          this.applyFilter()

          if (this.isBrowser) {
            try {
              localStorage.setItem('guides_cache', JSON.stringify(this.guides))
            } catch (e) {
              console.warn('Cache localStorage impossible', e)
            }
          }

          this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Erreur liste guides', err)

          if (this.isBrowser) {
            try {
              const cached = localStorage.getItem('guides_cache')

              if (cached) {
                this.guides = JSON.parse(cached) as Guide[]
                this.applyFilter()
                this.errorMessage = 'API indisponible. Données locales affichées.'
                this.cdr.detectChanges()
                return
              }
            } catch (e) {
              console.warn('Lecture cache impossible', e)
            }
          }

          this.guides = []
          this.filteredGuides = []
          this.errorMessage = 'Impossible de charger les guides.'
          this.cdr.detectChanges()
        }
      })
  }

  onSearchInput(value: string): void {
    this.searchTerm = value
    this.searchSubject.next(value)
  }

  clearSearch(): void {
    this.searchTerm = ''
    this.applyFilter()
    this.cdr.detectChanges()
  }

  trackByGuideId(index: number, guide: Guide): number {
    return guide.id
  }

  private applyFilter(): void {
    const q = this.searchTerm.trim().toLowerCase()

    if (!q) {
      this.filteredGuides = [...this.guides]
      return
    }

    this.filteredGuides = this.guides.filter(g =>
      g.title.toLowerCase().includes(q) ||
      (g.destination ?? '').toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    )
  }
}
