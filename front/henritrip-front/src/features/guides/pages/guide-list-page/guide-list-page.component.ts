import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core'
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs'
import { Guide } from '../../../../app/core/models/guide.model'
import { GuidesService } from '../../../../app/core/models/services/services'

@Component({
  selector: 'app-guide-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './guide-list-page.component.html',
  styleUrl: './guide-list-page.component.scss'
})
export class GuideListPageComponent implements OnInit {
  private guidesService = inject(GuidesService)
  private platformId = inject(PLATFORM_ID)
  private searchSubject = new Subject<string>()

  guides: Guide[] = []
  filteredGuides: Guide[] = []

  loading = false
  errorMessage = ''
  searchTerm = ''

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId)
  }

  ngOnInit(): void {
    this.loadGuides()

    this.searchSubject
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilter()
      })
  }

  loadGuides(): void {
    this.loading = true
    this.errorMessage = ''

    this.guidesService.getGuides().subscribe({
      next: (data: Guide[]) => {
        this.guides = data ?? []
        this.applyFilter()
        this.loading = false

        if (this.isBrowser) {
          localStorage.setItem('guides_cache', JSON.stringify(this.guides))
        }
      },
      error: () => {
        if (this.isBrowser) {
          const cached = localStorage.getItem('guides_cache')

          if (cached) {
            this.guides = JSON.parse(cached) as Guide[]
            this.applyFilter()
            this.errorMessage = 'API indisponible. Données locales affichées.'
          } else {
            this.errorMessage = 'Impossible de charger les guides.'
          }
        } else {
          this.errorMessage = 'Impossible de charger les guides.'
        }

        this.loading = false
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
