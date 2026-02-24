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
  isOffline = false

  // FILTRES
  showFilters = false
  selectedSeason = ''
  selectedMobility = ''
  selectedForWho = ''
  minDaysCount: number | null = null

  seasonOptions: string[] = []
  mobilityOptions: string[] = []
  forWhoOptions: string[] = []

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }

  get activeFiltersCount(): number {
    let count = 0
    if (this.selectedSeason) count++
    if (this.selectedMobility) count++
    if (this.selectedForWho) count++
    if (this.minDaysCount !== null) count++
    return count
  }

  private handleOnline = (): void => {
    this.isOffline = false
    this.errorMessage = ''
    this.loadGuides()
    this.cdr.detectChanges()
  }

  private handleOffline = (): void => {
    this.isOffline = true
    if (!this.errorMessage) {
      this.errorMessage = 'Mode hors ligne. Affichage des données en cache si disponibles.'
    }
    this.cdr.detectChanges()
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return
    }

    this.isOffline = !navigator.onLine

    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

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
    if (this.isBrowser) {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }

    this.destroy$.next()
    this.destroy$.complete()
  }

  loadGuides(): void {
    this.loading = true
    this.errorMessage = this.isOffline
      ? 'Mode hors ligne. Affichage des données en cache si disponibles.'
      : ''

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
          this.guides = data ?? []
          this.buildFilterOptions()
          this.applyFilter()

          this.isOffline = false
          this.errorMessage = ''

          if (this.isBrowser) {
            try {
              localStorage.setItem('guides_cache', JSON.stringify(this.guides))
              localStorage.setItem('guides_cache_updated_at', new Date().toISOString())
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
                this.buildFilterOptions()
                this.applyFilter()

                const offlineMsg = this.isOffline ? 'Mode hors ligne.' : 'API indisponible.'
                this.errorMessage = `${offlineMsg} Données locales affichées.`

                this.cdr.detectChanges()
                return
              }
            } catch (e) {
              console.warn('Lecture cache impossible', e)
            }
          }

          this.guides = []
          this.filteredGuides = []
          this.seasonOptions = []
          this.mobilityOptions = []
          this.forWhoOptions = []

          this.errorMessage = this.isOffline
            ? 'Mode hors ligne et aucun cache disponible.'
            : 'Impossible de charger les guides.'

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

  toggleFilters(): void {
    this.showFilters = !this.showFilters
  }

  onFilterChange(): void {
    this.applyFilter()
    this.cdr.detectChanges()
  }

  resetFilters(): void {
    this.selectedSeason = ''
    this.selectedMobility = ''
    this.selectedForWho = ''
    this.minDaysCount = null
    this.applyFilter()
    this.cdr.detectChanges()
  }

  trackByGuideId(index: number, guide: Guide): number {
    return guide.id
  }

  private buildFilterOptions(): void {
    this.seasonOptions = [...new Set(
      this.guides
        .map(g => g.season)
        .filter((v): v is string => !!v && v.trim().length > 0)
    )].sort()

    this.mobilityOptions = [...new Set(
      this.guides
        .map(g => g.mobility)
        .filter((v): v is string => !!v && v.trim().length > 0)
    )].sort()

    this.forWhoOptions = [...new Set(
      this.guides
        .map(g => g.forWho)
        .filter((v): v is string => !!v && v.trim().length > 0)
    )].sort()
  }

  private applyFilter(): void {
    const q = this.searchTerm.trim().toLowerCase()

    this.filteredGuides = this.guides.filter(g => {
      const matchesSearch = !q || (
        g.title.toLowerCase().includes(q) ||
        (g.destination ?? '').toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      )

      const matchesSeason = !this.selectedSeason || g.season === this.selectedSeason
      const matchesMobility = !this.selectedMobility || g.mobility === this.selectedMobility
      const matchesForWho = !this.selectedForWho || g.forWho === this.selectedForWho
      const matchesDays =
        this.minDaysCount === null || (g.daysCount ?? 0) >= this.minDaysCount

      return matchesSearch && matchesSeason && matchesMobility && matchesForWho && matchesDays
    })
  }
}
