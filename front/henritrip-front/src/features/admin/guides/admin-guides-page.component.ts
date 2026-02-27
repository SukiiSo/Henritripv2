import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { finalize, take, timeout } from 'rxjs'

import { Guide, GuideDetail, GuideDay, GuideActivity } from '../../../app/core/models/guide.model'
import { AdminGuidesService, CreateActivityRequest } from '../../../app/core/services/admin-guides.service'
import { AdminUsersService, AdminUser } from '../../../app/core/services/admin-users.service'
import { pageFadeIn, slideDown, fadeUp, panelReveal, alertFade } from '../../../app/animations'

type GuideForm = {
  id: number | null
  title: string
  description: string
  numberOfDays: number
  mobility: string
  season: string
  forWho: string
  destination: string
  coverImageUrl: string
}

type ActivityForm = {
  id: number | null
  title: string
  description: string
  category: string
  address: string
  phoneNumber: string
  openingHours: string
  website: string
  startTime: string
  endTime: string
  forWho: string
  visitOrder: number | null
}

@Component({
  selector: 'app-admin-guides-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-guides-page.component.html',
  styleUrl: './admin-guides-page.component.scss',
  animations: [pageFadeIn, slideDown, fadeUp, panelReveal, alertFade]
})
export class AdminGuidesPageComponent implements OnInit {
  private adminGuidesService = inject(AdminGuidesService)
  private adminUsersService = inject(AdminUsersService)
  private cdr = inject(ChangeDetectorRef)

  guides: Guide[] = []
  allUsers: AdminUser[] = []

  selectedGuideDetail: GuideDetail | null = null
  selectedGuideInvitedUserIds = new Set<number>()

  loadingGuides = false
  loadingUsers = false
  loadingGuideDetailId: number | null = null

  savingGuide = false
  savingDay = false
  savingActivity = false

  deletingGuideIds = new Set<number>()
  deletingActivityIds = new Set<number>()
  invitationBusyUserIds = new Set<number>()

  errorMessage = ''
  message = ''
  search = ''

  editingDayId: number | null = null
  addingActivityDayId: number | null = null
  editingActivityId: number | null = null
  editingActivityDayId: number | null = null

  readonly mobilityOptions = ['Voiture', 'Velo', 'Pied', 'Moto']
  readonly seasonOptions = ['Ete', 'Printemps', 'Automne', 'Hiver']
  readonly forWhoOptions = ['Famille', 'Seul', 'Groupe', 'EntreAmis']
  readonly categoryOptions = ['Musee', 'Chateau', 'Activite', 'Parc', 'Grotte']

  guideForm: GuideForm = this.emptyGuideForm()

  dayEditForm = { title: '', date: '' }

  activityForm: ActivityForm = this.emptyActivityForm()

  ngOnInit(): void {
    this.loadGuides()
    this.loadUsers()
  }

  refreshGuidesList(): void {
    this.errorMessage = ''
    this.message = ''
    this.loadGuides()
    this.loadUsers()

    if (this.selectedGuideDetail?.id) {
      this.openGuideAdmin(this.selectedGuideDetail.id, false)
    }
  }

  loadGuides(): void {
    this.loadingGuides = true
    this.errorMessage = ''
    this.cdr.markForCheck()

    this.adminGuidesService.getGuides(this.search)
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.loadingGuides = false
          this.cdr.markForCheck()
        })
      )
      .subscribe({
        next: (guides: Guide[]) => {
          this.guides = [...(Array.isArray(guides) ? guides : [])]
        },
        error: (err: unknown) => {
          this.loadingGuides = false
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? (err as Error)?.message ?? 'Impossible de charger les guides.'
          this.cdr.markForCheck()
        }
      })
  }

  loadUsers(): void {
    this.loadingUsers = true
    this.cdr.markForCheck()

    this.adminUsersService.getUsers()
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.loadingUsers = false
          this.cdr.markForCheck()
        })
      )
      .subscribe({
        next: (users: AdminUser[]) => {
          this.allUsers = [...users.filter(u => u.role === 'User')]
        },
        error: (err: unknown) => {
          this.loadingUsers = false
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? (err as Error)?.message ?? 'Impossible de charger les users.'
          this.cdr.markForCheck()
        }
      })
  }

  submitGuideForm(): void {
    this.errorMessage = ''
    this.message = ''

    if (!this.guideForm.title.trim() || !this.guideForm.description.trim()) {
      this.errorMessage = 'Titre et description obligatoires.'
      return
    }

    if (!this.guideForm.numberOfDays || this.guideForm.numberOfDays < 1) {
      this.errorMessage = 'Le nombre de jours doit être supérieur ou égal à 1.'
      return
    }

    const payload = {
      title: this.guideForm.title.trim(),
      description: this.guideForm.description.trim(),
      numberOfDays: Number(this.guideForm.numberOfDays),
      mobility: this.guideForm.mobility,
      season: this.guideForm.season,
      forWho: this.guideForm.forWho,
      destination: this.guideForm.destination.trim() || null,
      coverImageUrl: this.guideForm.coverImageUrl.trim() || null
    }

    this.savingGuide = true

    if (this.guideForm.id) {
      const id = this.guideForm.id
      this.adminGuidesService.updateGuide(id, payload)
        .pipe(finalize(() => { this.savingGuide = false }))
        .subscribe({
          next: () => {
            this.message = 'Guide mis à jour.'
            this.loadGuides()
            if (this.selectedGuideDetail?.id === id) this.openGuideAdmin(id)
          },
          error: (err: unknown) => {
            const httpErr = err as { error?: { message?: string } }
            this.errorMessage = httpErr?.error?.message ?? 'Impossible de mettre à jour le guide.'
          }
        })
      return
    }

    this.adminGuidesService.createGuide(payload)
      .pipe(finalize(() => { this.savingGuide = false }))
      .subscribe({
        next: () => {
          this.message = 'Guide créé.'
          this.resetGuideForm()
          this.loadGuides()
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? 'Impossible de créer le guide.'
        }
      })
  }

  editGuide(id: number): void {
    this.loadingGuideDetailId = id
    this.errorMessage = ''

    this.adminGuidesService.getGuideById(id)
      .pipe(take(1), finalize(() => { this.loadingGuideDetailId = null }))
      .subscribe({
        next: (guide) => {
          this.guideForm = {
            id: guide.id,
            title: guide.title ?? '',
            description: guide.description ?? '',
            numberOfDays: guide.daysCount ?? 1,
            mobility: guide.mobility ?? 'Pied',
            season: guide.season ?? 'Printemps',
            forWho: guide.forWho ?? 'EntreAmis',
            destination: guide.destination ?? '',
            coverImageUrl: guide.coverImageUrl ?? ''
          }
          window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? 'Impossible de charger le guide.'
        }
      })
  }

  openGuideAdmin(id: number, scroll = true): void {
    this.loadingGuideDetailId = id
    this.errorMessage = ''
    this.message = ''
    this.editingDayId = null
    this.addingActivityDayId = null
    this.editingActivityId = null
    this.editingActivityDayId = null
    this.resetActivityForm()

    this.adminGuidesService.getGuideById(id)
      .pipe(take(1), finalize(() => { this.loadingGuideDetailId = null }))
      .subscribe({
        next: (guide) => {
          this.selectedGuideDetail = { ...guide, days: [...(guide.days ?? [])] } as GuideDetail
          this.selectedGuideInvitedUserIds = new Set((guide.invitedUserIds ?? []) as number[])

          if (scroll) setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 0)
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? 'Impossible de charger le détail du guide.'
        }
      })
  }

  deleteGuide(guide: Guide): void {
    this.errorMessage = ''
    this.message = ''

    if (!confirm(`Supprimer le guide "${guide.title}" ?`)) return

    this.deletingGuideIds.add(guide.id)

    this.adminGuidesService.deleteGuide(guide.id)
      .pipe(finalize(() => { this.deletingGuideIds.delete(guide.id) }))
      .subscribe({
        next: () => {
          this.message = 'Guide supprimé.'
          this.guides = this.guides.filter(g => g.id !== guide.id)
          if (this.selectedGuideDetail?.id === guide.id) {
            this.selectedGuideDetail = null
            this.selectedGuideInvitedUserIds.clear()
          }
          if (this.guideForm.id === guide.id) this.resetGuideForm()
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? 'Impossible de supprimer le guide.'
        }
      })
  }

  isUserInvited(userId: number): boolean {
    return this.selectedGuideInvitedUserIds.has(userId)
  }

  toggleInvitation(user: AdminUser, checked: boolean): void {
    if (!this.selectedGuideDetail) return

    this.errorMessage = ''
    this.message = ''
    this.invitationBusyUserIds.add(user.id)

    const guideId = this.selectedGuideDetail.id

    if (checked) {
      this.adminGuidesService.inviteUser(guideId, user.id)
        .pipe(finalize(() => { this.invitationBusyUserIds.delete(user.id) }))
        .subscribe({
          next: () => {
            this.selectedGuideInvitedUserIds.add(user.id)
            this.message = `Invitation ajoutée pour ${user.email}.`
          },
          error: (err: unknown) => {
            const httpErr = err as { error?: { message?: string } }
            this.errorMessage = httpErr?.error?.message ?? "Impossible de modifier l'invitation."
          }
        })
      return
    }

    this.adminGuidesService.removeInvitation(guideId, user.id)
      .pipe(finalize(() => { this.invitationBusyUserIds.delete(user.id) }))
      .subscribe({
        next: () => {
          this.selectedGuideInvitedUserIds.delete(user.id)
          this.message = `Invitation retirée pour ${user.email}.`
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? "Impossible de modifier l'invitation."
        }
      })
  }

  toggleDayEdit(dayId: number): void {
    if (!this.selectedGuideDetail) return

    if (this.editingDayId === dayId) {
      this.editingDayId = null
      return
    }

    const day = this.selectedGuideDetail.days.find(d => d.id === dayId)
    if (!day) return

    this.editingDayId = dayId
    this.dayEditForm = { title: day.title ?? '', date: day.date ?? '' }
  }

  saveDay(day: GuideDay): void {
    if (!this.selectedGuideDetail) return

    this.errorMessage = ''
    this.message = ''

    if (!this.dayEditForm.title.trim()) {
      this.errorMessage = 'Le titre du jour est obligatoire.'
      return
    }

    this.savingDay = true

    this.adminGuidesService.updateGuideDay(this.selectedGuideDetail.id, day.id, {
      title: this.dayEditForm.title.trim(),
      date: this.dayEditForm.date.trim() || null
    })
      .pipe(finalize(() => { this.savingDay = false }))
      .subscribe({
        next: () => {
          day.title = this.dayEditForm.title.trim()
          day.date = this.dayEditForm.date.trim() || undefined
          this.message = 'Jour mis à jour.'
          this.editingDayId = null
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? 'Impossible de mettre à jour le jour.'
        }
      })
  }

  toggleAddActivity(dayId: number): void {
    if (this.addingActivityDayId === dayId) {
      this.addingActivityDayId = null
      this.resetActivityForm()
      return
    }

    this.addingActivityDayId = dayId
    this.editingActivityId = null
    this.editingActivityDayId = null
    this.resetActivityForm()
  }

  startEditActivity(day: GuideDay, activity: GuideActivity): void {
    this.addingActivityDayId = null
    this.editingActivityId = activity.id
    this.editingActivityDayId = day.id

    this.activityForm = {
      id: activity.id,
      title: activity.title ?? '',
      description: activity.description ?? '',
      category: activity.category ?? 'Activite',
      address: activity.address ?? '',
      phoneNumber: activity.phoneNumber ?? '',
      openingHours: activity.openingHours ?? '',
      website: activity.website ?? '',
      startTime: activity.startTime ?? '',
      endTime: activity.endTime ?? '',
      forWho: activity.forWho ?? 'EntreAmis',
      visitOrder: activity.visitOrder ?? null
    }
  }

  createActivity(day: GuideDay): void {
    if (!this.selectedGuideDetail) return

    const payload = this.buildActivityPayload()
    if (!payload) return

    this.savingActivity = true

    this.adminGuidesService.createActivity(this.selectedGuideDetail.id, day.id, payload)
      .pipe(finalize(() => { this.savingActivity = false }))
      .subscribe({
        next: () => {
          this.message = 'Activité ajoutée.'
          this.resetActivityForm()
          this.addingActivityDayId = null
          this.openGuideAdmin(this.selectedGuideDetail!.id)
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? "Impossible d'ajouter l'activité."
        }
      })
  }

  saveActivity(day: GuideDay): void {
    if (!this.selectedGuideDetail || !this.editingActivityId) return

    const payload = this.buildActivityPayload()
    if (!payload) return

    this.savingActivity = true

    this.adminGuidesService.updateActivity(this.selectedGuideDetail.id, day.id, this.editingActivityId, payload)
      .pipe(finalize(() => { this.savingActivity = false }))
      .subscribe({
        next: () => {
          this.message = 'Activité mise à jour.'
          this.editingActivityId = null
          this.editingActivityDayId = null
          this.resetActivityForm()
          this.openGuideAdmin(this.selectedGuideDetail!.id)
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? "Impossible de mettre à jour l'activité."
        }
      })
  }

  deleteActivity(day: GuideDay, activity: GuideActivity): void {
    if (!this.selectedGuideDetail) return

    if (!confirm(`Supprimer l'activité "${activity.title}" ?`)) return

    this.deletingActivityIds.add(activity.id)

    this.adminGuidesService.deleteActivity(this.selectedGuideDetail.id, day.id, activity.id)
      .pipe(finalize(() => { this.deletingActivityIds.delete(activity.id) }))
      .subscribe({
        next: () => {
          this.message = 'Activité supprimée.'
          this.openGuideAdmin(this.selectedGuideDetail!.id)
        },
        error: (err: unknown) => {
          const httpErr = err as { error?: { message?: string } }
          this.errorMessage = httpErr?.error?.message ?? "Impossible de supprimer l'activité."
        }
      })
  }

  resetGuideForm(): void {
    this.guideForm = this.emptyGuideForm()
  }

  resetActivityForm(): void {
    this.activityForm = this.emptyActivityForm()
  }

  private buildActivityPayload(): CreateActivityRequest | null {
    if (!this.activityForm.title.trim() || !this.activityForm.description.trim() || !this.activityForm.address.trim()) {
      this.errorMessage = 'Titre, description et adresse sont obligatoires pour une activité.'
      return null
    }

    return {
      title: this.activityForm.title.trim(),
      description: this.activityForm.description.trim(),
      category: this.activityForm.category,
      address: this.activityForm.address.trim(),
      phoneNumber: this.activityForm.phoneNumber.trim() || null,
      openingHours: this.activityForm.openingHours.trim() || null,
      website: this.activityForm.website.trim() || null,
      startTime: this.activityForm.startTime.trim() || null,
      endTime: this.activityForm.endTime.trim() || null,
      forWho: this.activityForm.forWho,
      visitOrder: this.activityForm.visitOrder ?? null
    }
  }

  private emptyGuideForm(): GuideForm {
    return {
      id: null, title: '', description: '', numberOfDays: 2,
      mobility: 'Pied', season: 'Printemps', forWho: 'EntreAmis',
      destination: '', coverImageUrl: ''
    }
  }

  private emptyActivityForm(): ActivityForm {
    return {
      id: null, title: '', description: '', category: 'Activite',
      address: '', phoneNumber: '', openingHours: '', website: '',
      startTime: '', endTime: '', forWho: 'EntreAmis', visitOrder: null
    }
  }
}
