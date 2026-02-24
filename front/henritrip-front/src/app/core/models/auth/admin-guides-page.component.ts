import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { finalize } from 'rxjs'

import { Guide, GuideDetail, GuideDay, GuideActivity } from '../guide.model'
import {
  AdminGuidesService,
  CreateActivityRequest
} from './admin-guides.service'
import { AdminUsersService, AdminUser } from './admin-users.service'

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
  template: `
    <section style="padding:16px; color:#eef3ff; background:#0f1a33; min-height:100vh;">
      <h1 style="margin:0 0 8px;">Admin guides</h1>
      <p style="margin:0 0 16px; color:#b8c6ea;">
        Gestion des guides, invitations, jours et activités.
      </p>

      <div *ngIf="message" style="margin-bottom:12px; padding:10px 12px; border-radius:10px; border:1px solid #23426a; background:#132644; color:#bcd7ff;">
        {{ message }}
      </div>

      <div *ngIf="errorMessage" style="margin-bottom:12px; padding:10px 12px; border-radius:10px; border:1px solid #6a2323; background:#351818; color:#ffcaca;">
        {{ errorMessage }}
      </div>

      <!-- Form guide -->
      <div style="background:#1b2747; border:1px solid #243864; border-radius:14px; padding:14px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px;">
          <h2 style="margin:0; font-size:1.05rem;">
            {{ guideForm.id ? ('Modifier guide #' + guideForm.id) : 'Créer un guide' }}
          </h2>

          <button
            *ngIf="guideForm.id"
            type="button"
            (click)="resetGuideForm()"
            style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:8px 12px; cursor:pointer;"
          >
            Nouveau guide
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
          <div style="grid-column:1 / -1;">
            <label style="display:block; margin-bottom:6px;">Titre</label>
            <input [(ngModel)]="guideForm.title" type="text"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
          </div>

          <div style="grid-column:1 / -1;">
            <label style="display:block; margin-bottom:6px;">Description</label>
            <textarea [(ngModel)]="guideForm.description" rows="3"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px; resize:vertical;"></textarea>
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Nombre de jours</label>
            <input [(ngModel)]="guideForm.numberOfDays" type="number" min="1"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Mobilité</label>
            <select [(ngModel)]="guideForm.mobility"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;">
              <option *ngFor="let v of mobilityOptions" [value]="v">{{ v }}</option>
            </select>
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Saison</label>
            <select [(ngModel)]="guideForm.season"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;">
              <option *ngFor="let v of seasonOptions" [value]="v">{{ v }}</option>
            </select>
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Pour qui</label>
            <select [(ngModel)]="guideForm.forWho"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;">
              <option *ngFor="let v of forWhoOptions" [value]="v">{{ v }}</option>
            </select>
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Destination</label>
            <input [(ngModel)]="guideForm.destination" type="text"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
          </div>

          <div>
            <label style="display:block; margin-bottom:6px;">Image URL</label>
            <input [(ngModel)]="guideForm.coverImageUrl" type="text"
              style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
          </div>
        </div>

        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
          <button
            type="button"
            (click)="submitGuideForm()"
            [disabled]="savingGuide"
            style="border-radius:10px; border:1px solid #4b79d2; background:#2f62c9; color:white; padding:8px 12px; cursor:pointer;"
          >
            {{ savingGuide ? 'Enregistrement...' : (guideForm.id ? 'Mettre à jour' : 'Créer le guide') }}
          </button>

          <button
            type="button"
            (click)="resetGuideForm()"
            style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:8px 12px; cursor:pointer;"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- Liste guides -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
        <h2 style="margin:0; font-size:1.05rem;">Liste des guides</h2>

        <div style="display:flex; gap:8px; align-items:center;">
          <input
            [(ngModel)]="search"
            (keyup.enter)="loadGuides()"
            placeholder="Recherche"
            style="border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:8px 10px;"
          />
          <button
            type="button"
            (click)="loadGuides()"
            [disabled]="loadingGuides"
            style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:8px 12px; cursor:pointer;"
          >
            {{ loadingGuides ? 'Chargement...' : 'Rafraîchir' }}
          </button>
        </div>
      </div>

      <div style="background:#1b2747; border:1px solid #243864; border-radius:14px; overflow:hidden; margin-bottom:16px;">
        <div *ngIf="loadingGuides" style="padding:14px;">Chargement...</div>

        <div *ngIf="!loadingGuides && guides.length === 0" style="padding:14px;">
          Aucun guide.
        </div>

        <table *ngIf="!loadingGuides && guides.length > 0" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#16223f;">
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">ID</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">Titre</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">Destination</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">Jours</th>
              <th style="text-align:left; padding:10px; border-bottom:1px solid #263a65;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let guide of guides" style="border-bottom:1px solid #223357;">
              <td style="padding:10px;">{{ guide.id }}</td>
              <td style="padding:10px;">{{ guide.title }}</td>
              <td style="padding:10px;">{{ guide.destination || '-' }}</td>
              <td style="padding:10px;">{{ guide.daysCount || '-' }}</td>
              <td style="padding:10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button
                  type="button"
                  (click)="openGuideAdmin(guide.id)"
                  [disabled]="loadingGuideDetailId === guide.id"
                  style="border-radius:10px; border:1px solid #345b7a; background:#1f3444; color:#d7efff; padding:6px 10px; cursor:pointer;"
                >
                  {{ loadingGuideDetailId === guide.id ? 'Chargement...' : 'Gérer' }}
                </button>

                <button
                  type="button"
                  (click)="editGuide(guide.id)"
                  [disabled]="loadingGuideDetailId === guide.id"
                  style="border-radius:10px; border:1px solid #345b7a; background:#1f3444; color:#d7efff; padding:6px 10px; cursor:pointer;"
                >
                  Éditer
                </button>

                <button
                  type="button"
                  (click)="deleteGuide(guide)"
                  [disabled]="deletingGuideIds.has(guide.id)"
                  style="border-radius:10px; border:1px solid #7a3434; background:#441f1f; color:#ffd6d6; padding:6px 10px; cursor:pointer;"
                >
                  {{ deletingGuideIds.has(guide.id) ? 'Suppression...' : 'Supprimer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Panneau gestion guide sélectionné -->
      <div *ngIf="selectedGuideDetail" style="background:#1b2747; border:1px solid #243864; border-radius:14px; padding:14px;">
        <h2 style="margin:0 0 6px; font-size:1.05rem;">
          Gestion détaillée, {{ selectedGuideDetail.title }}
        </h2>
        <p style="margin:0 0 16px; color:#b8c6ea;">
          Invitations users, jours et activités.
        </p>

        <!-- Invitations -->
        <div style="border:1px solid #263a65; border-radius:12px; padding:12px; margin-bottom:16px; background:#16223f;">
          <h3 style="margin:0 0 10px; font-size:1rem;">Invitations users</h3>

          <div *ngIf="loadingUsers" style="color:#b8c6ea;">Chargement des users...</div>

          <div *ngIf="!loadingUsers && allUsers.length === 0">Aucun user disponible.</div>

          <div *ngIf="!loadingUsers && allUsers.length > 0" style="display:grid; gap:8px;">
            <label
              *ngFor="let user of allUsers"
              style="display:flex; align-items:center; justify-content:space-between; gap:10px; border:1px solid #263a65; background:#121e39; border-radius:10px; padding:8px 10px;"
            >
              <span>
                {{ user.email }}
                <small style="color:#9fb2de;">({{ user.role }})</small>
              </span>

              <span style="display:flex; align-items:center; gap:8px;">
                <input
                  type="checkbox"
                  [checked]="isUserInvited(user.id)"
                  [disabled]="invitationBusyUserIds.has(user.id)"
                  (change)="toggleInvitation(user, $any($event.target).checked)"
                />
                <small *ngIf="invitationBusyUserIds.has(user.id)" style="color:#9fb2de;">...</small>
              </span>
            </label>
          </div>
        </div>

        <!-- Jours + activités -->
        <div style="display:grid; gap:12px;">
          <div
            *ngFor="let day of selectedGuideDetail.days"
            style="border:1px solid #263a65; border-radius:12px; padding:12px; background:#16223f;"
          >
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
              <div>
                <strong>Jour {{ day.dayNumber }}</strong>
                <span style="color:#b8c6ea;">, {{ day.title }}</span>
                <span *ngIf="day.date" style="color:#9fb2de;">, {{ day.date }}</span>
              </div>

              <button
                type="button"
                (click)="toggleDayEdit(day.id)"
                style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:6px 10px; cursor:pointer;"
              >
                {{ editingDayId === day.id ? 'Fermer' : 'Éditer le jour' }}
              </button>
            </div>

            <!-- Form édition jour -->
            <div *ngIf="editingDayId === day.id" style="border:1px solid #263a65; border-radius:10px; padding:10px; margin-bottom:12px; background:#101a31;">
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                <div>
                  <label style="display:block; margin-bottom:6px;">Titre du jour</label>
                  <input [(ngModel)]="dayEditForm.title" type="text"
                    style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
                </div>

                <div>
                  <label style="display:block; margin-bottom:6px;">Date (yyyy-MM-dd)</label>
                  <input [(ngModel)]="dayEditForm.date" type="text" placeholder="2025-09-01"
                    style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
                </div>
              </div>

              <div style="margin-top:10px;">
                <button
                  type="button"
                  (click)="saveDay(day)"
                  [disabled]="savingDay"
                  style="border-radius:10px; border:1px solid #4b79d2; background:#2f62c9; color:white; padding:8px 12px; cursor:pointer;"
                >
                  {{ savingDay ? 'Enregistrement...' : 'Sauvegarder le jour' }}
                </button>
              </div>
            </div>

            <!-- Activités -->
            <div style="margin-bottom:10px;">
              <div style="font-weight:600; margin-bottom:8px;">Activités</div>

              <div *ngIf="!day.activities || day.activities.length === 0" style="color:#b8c6ea; margin-bottom:10px;">
                Aucune activité.
              </div>

              <div *ngFor="let activity of day.activities" style="border:1px solid #25395f; background:#121e39; border-radius:10px; padding:10px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start; flex-wrap:wrap;">
                  <div>
                    <div><strong>#{{ activity.visitOrder }}</strong> {{ activity.title }}</div>
                    <div style="color:#b8c6ea; font-size:0.92rem;">{{ activity.category }} , {{ activity.forWho }} , {{ activity.address }}</div>
                    <div style="color:#9fb2de; font-size:0.9rem;" *ngIf="activity.startTime || activity.endTime">
                      {{ activity.startTime || '-' }} à {{ activity.endTime || '-' }}
                    </div>
                  </div>

                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button
                      type="button"
                      (click)="startEditActivity(day, activity)"
                      style="border-radius:10px; border:1px solid #345b7a; background:#1f3444; color:#d7efff; padding:6px 10px; cursor:pointer;"
                    >
                      Éditer
                    </button>

                    <button
                      type="button"
                      (click)="deleteActivity(day, activity)"
                      [disabled]="deletingActivityIds.has(activity.id)"
                      style="border-radius:10px; border:1px solid #7a3434; background:#441f1f; color:#ffd6d6; padding:6px 10px; cursor:pointer;"
                    >
                      {{ deletingActivityIds.has(activity.id) ? 'Suppression...' : 'Supprimer' }}
                    </button>
                  </div>
                </div>

                <!-- Form édition activité -->
                <div *ngIf="editingActivityId === activity.id" style="margin-top:10px; border-top:1px solid #25395f; padding-top:10px;">
                  <ng-container *ngTemplateOutlet="activityFormTpl; context: { day: day, mode: 'edit' }"></ng-container>
                </div>
              </div>
            </div>

            <!-- Ajouter activité -->
            <div style="border-top:1px solid #25395f; padding-top:10px;">
              <button
                type="button"
                (click)="toggleAddActivity(day.id)"
                style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:6px 10px; cursor:pointer;"
              >
                {{ addingActivityDayId === day.id ? 'Fermer ajout activité' : 'Ajouter une activité' }}
              </button>

              <div *ngIf="addingActivityDayId === day.id" style="margin-top:10px;">
                <ng-container *ngTemplateOutlet="activityFormTpl; context: { day: day, mode: 'create' }"></ng-container>
              </div>
            </div>
          </div>
        </div>

        <ng-template #activityFormTpl let-day="day" let-mode="mode">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
            <div style="grid-column:1 / -1;">
              <label style="display:block; margin-bottom:6px;">Titre</label>
              <input [(ngModel)]="activityForm.title" type="text"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>

            <div style="grid-column:1 / -1;">
              <label style="display:block; margin-bottom:6px;">Description</label>
              <textarea [(ngModel)]="activityForm.description" rows="2"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px; resize:vertical;"></textarea>
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Catégorie</label>
              <select [(ngModel)]="activityForm.category"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;">
                <option *ngFor="let c of categoryOptions" [value]="c">{{ c }}</option>
              </select>
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Pour qui</label>
              <select [(ngModel)]="activityForm.forWho"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;">
                <option *ngFor="let v of forWhoOptions" [value]="v">{{ v }}</option>
              </select>
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Ordre de visite</label>
              <input [(ngModel)]="activityForm.visitOrder" type="number" min="1"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>

            <div style="grid-column:1 / -1;">
              <label style="display:block; margin-bottom:6px;">Adresse</label>
              <input [(ngModel)]="activityForm.address" type="text"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Téléphone</label>
              <input [(ngModel)]="activityForm.phoneNumber" type="text"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Horaires</label>
              <input [(ngModel)]="activityForm.openingHours" type="text"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Site web</label>
              <input [(ngModel)]="activityForm.website" type="text"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Heure début</label>
              <input [(ngModel)]="activityForm.startTime" type="text" placeholder="09:00"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>

            <div>
              <label style="display:block; margin-bottom:6px;">Heure fin</label>
              <input [(ngModel)]="activityForm.endTime" type="text" placeholder="10:30"
                style="width:100%; border-radius:10px; border:1px solid #344d7b; background:#111c35; color:#eef3ff; padding:10px;" />
            </div>
          </div>

          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button
              *ngIf="mode === 'create'"
              type="button"
              (click)="createActivity(day)"
              [disabled]="savingActivity"
              style="border-radius:10px; border:1px solid #4b79d2; background:#2f62c9; color:white; padding:8px 12px; cursor:pointer;"
            >
              {{ savingActivity ? 'Ajout...' : 'Ajouter activité' }}
            </button>

            <button
              *ngIf="mode === 'edit'"
              type="button"
              (click)="saveActivity(day)"
              [disabled]="savingActivity"
              style="border-radius:10px; border:1px solid #4b79d2; background:#2f62c9; color:white; padding:8px 12px; cursor:pointer;"
            >
              {{ savingActivity ? 'Enregistrement...' : 'Sauvegarder activité' }}
            </button>

            <button
              type="button"
              (click)="resetActivityForm()"
              style="border-radius:10px; border:1px solid #344d7b; background:#172645; color:#e4ecff; padding:8px 12px; cursor:pointer;"
            >
              Réinitialiser
            </button>
          </div>
        </ng-template>
      </div>
    </section>
  `
})
export class AdminGuidesPageComponent implements OnInit {
  private adminGuidesService = inject(AdminGuidesService)
  private adminUsersService = inject(AdminUsersService)

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

  mobilityOptions = ['Voiture', 'Velo', 'Pied', 'Moto']
  seasonOptions = ['Ete', 'Printemps', 'Automne', 'Hiver']
  forWhoOptions = ['Famille', 'Seul', 'Groupe', 'EntreAmis']
  categoryOptions = ['Musee', 'Chateau', 'Activite', 'Parc', 'Grotte']

  guideForm: GuideForm = this.getEmptyGuideForm()

  dayEditForm = {
    title: '',
    date: ''
  }

  activityForm: ActivityForm = this.getEmptyActivityForm()

  ngOnInit(): void {
    this.loadGuides()
    this.loadUsers()
  }

  loadGuides(): void {
    this.loadingGuides = true
    this.errorMessage = ''

    this.adminGuidesService.getGuides(this.search)
      .pipe(finalize(() => (this.loadingGuides = false)))
      .subscribe({
        next: (guides) => {
          this.guides = guides ?? []
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de charger les guides.'
        }
      })
  }

  loadUsers(): void {
    this.loadingUsers = true

    this.adminUsersService.getUsers()
      .pipe(finalize(() => (this.loadingUsers = false)))
      .subscribe({
        next: (users) => {
          this.allUsers = (users ?? []).filter(u => u.role === 'User')
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de charger les users.'
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
      this.adminGuidesService.updateGuide(this.guideForm.id, payload)
        .pipe(finalize(() => (this.savingGuide = false)))
        .subscribe({
          next: () => {
            this.message = 'Guide mis à jour.'
            this.loadGuides()
            if (this.selectedGuideDetail?.id === this.guideForm.id) {
              this.openGuideAdmin(this.guideForm.id)
            }
          },
          error: (err) => {
            this.errorMessage = err?.error?.message ?? 'Impossible de mettre à jour le guide.'
          }
        })
      return
    }

    this.adminGuidesService.createGuide(payload)
      .pipe(finalize(() => (this.savingGuide = false)))
      .subscribe({
        next: () => {
          this.message = 'Guide créé.'
          this.resetGuideForm()
          this.loadGuides()
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de créer le guide.'
        }
      })
  }

  editGuide(id: number): void {
    this.loadingGuideDetailId = id
    this.errorMessage = ''
    this.message = ''

    this.adminGuidesService.getGuideById(id)
      .pipe(finalize(() => (this.loadingGuideDetailId = null)))
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
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de charger le guide.'
        }
      })
  }

  openGuideAdmin(id: number): void {
    this.loadingGuideDetailId = id
    this.errorMessage = ''
    this.message = ''

    this.editingDayId = null
    this.addingActivityDayId = null
    this.editingActivityId = null
    this.editingActivityDayId = null
    this.resetActivityForm()

    this.adminGuidesService.getGuideById(id)
      .pipe(finalize(() => (this.loadingGuideDetailId = null)))
      .subscribe({
        next: (guide) => {
          this.selectedGuideDetail = guide

          const invited = (guide.invitedUserIds ?? []) as number[]
          this.selectedGuideInvitedUserIds = new Set(invited)

          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de charger le détail du guide.'
        }
      })
  }

  deleteGuide(guide: Guide): void {
    this.errorMessage = ''
    this.message = ''

    const ok = confirm(`Supprimer le guide "${guide.title}" ?`)
    if (!ok) return

    this.deletingGuideIds.add(guide.id)

    this.adminGuidesService.deleteGuide(guide.id)
      .pipe(finalize(() => this.deletingGuideIds.delete(guide.id)))
      .subscribe({
        next: () => {
          this.message = 'Guide supprimé.'
          this.guides = this.guides.filter(g => g.id !== guide.id)

          if (this.selectedGuideDetail?.id === guide.id) {
            this.selectedGuideDetail = null
            this.selectedGuideInvitedUserIds.clear()
          }

          if (this.guideForm.id === guide.id) {
            this.resetGuideForm()
          }
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de supprimer le guide.'
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
      .pipe(finalize(() => this.invitationBusyUserIds.delete(user.id)))
      .subscribe({
        next: () => {
          this.selectedGuideInvitedUserIds.add(user.id)
          this.message = `Invitation ajoutée pour ${user.email}.`
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de modifier l invitation.'
        }
      })

    return
  }

  this.adminGuidesService.removeInvitation(guideId, user.id)
    .pipe(finalize(() => this.invitationBusyUserIds.delete(user.id)))
    .subscribe({
      next: () => {
        this.selectedGuideInvitedUserIds.delete(user.id)
        this.message = `Invitation retirée pour ${user.email}.`
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message ?? 'Impossible de modifier l invitation.'
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
    this.dayEditForm = {
      title: day.title ?? '',
      date: day.date ?? ''
    }
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
      .pipe(finalize(() => (this.savingDay = false)))
      .subscribe({
        next: () => {
          day.title = this.dayEditForm.title.trim()
          day.date = this.dayEditForm.date.trim() || undefined
          this.message = 'Jour mis à jour.'
          this.editingDayId = null
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de mettre à jour le jour.'
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

    this.errorMessage = ''
    this.message = ''

    const payload = this.buildActivityPayload()
    if (!payload) return

    this.savingActivity = true

    this.adminGuidesService.createActivity(this.selectedGuideDetail.id, day.id, payload)
      .pipe(finalize(() => (this.savingActivity = false)))
      .subscribe({
        next: () => {
          this.message = 'Activité ajoutée.'
          this.resetActivityForm()
          this.addingActivityDayId = null
          this.openGuideAdmin(this.selectedGuideDetail!.id)
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible d ajouter l activité.'
        }
      })
  }

  saveActivity(day: GuideDay): void {
    if (!this.selectedGuideDetail || !this.editingActivityId) return

    this.errorMessage = ''
    this.message = ''

    const payload = this.buildActivityPayload()
    if (!payload) return

    this.savingActivity = true

    this.adminGuidesService.updateActivity(
      this.selectedGuideDetail.id,
      day.id,
      this.editingActivityId,
      payload
    )
      .pipe(finalize(() => (this.savingActivity = false)))
      .subscribe({
        next: () => {
          this.message = 'Activité mise à jour.'
          this.editingActivityId = null
          this.editingActivityDayId = null
          this.resetActivityForm()
          this.openGuideAdmin(this.selectedGuideDetail!.id)
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de mettre à jour l activité.'
        }
      })
  }

  deleteActivity(day: GuideDay, activity: GuideActivity): void {
    if (!this.selectedGuideDetail) return

    this.errorMessage = ''
    this.message = ''

    const ok = confirm(`Supprimer l'activité "${activity.title}" ?`)
    if (!ok) return

    this.deletingActivityIds.add(activity.id)

    this.adminGuidesService.deleteActivity(this.selectedGuideDetail.id, day.id, activity.id)
      .pipe(finalize(() => this.deletingActivityIds.delete(activity.id)))
      .subscribe({
        next: () => {
          this.message = 'Activité supprimée.'
          this.openGuideAdmin(this.selectedGuideDetail!.id)
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'Impossible de supprimer l activité.'
        }
      })
  }

  resetGuideForm(): void {
    this.guideForm = this.getEmptyGuideForm()
  }

  resetActivityForm(): void {
    this.activityForm = this.getEmptyActivityForm()
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

  private getEmptyGuideForm(): GuideForm {
    return {
      id: null,
      title: '',
      description: '',
      numberOfDays: 2,
      mobility: 'Pied',
      season: 'Printemps',
      forWho: 'EntreAmis',
      destination: '',
      coverImageUrl: ''
    }
  }

  private getEmptyActivityForm(): ActivityForm {
    return {
      id: null,
      title: '',
      description: '',
      category: 'Activite',
      address: '',
      phoneNumber: '',
      openingHours: '',
      website: '',
      startTime: '',
      endTime: '',
      forWho: 'EntreAmis',
      visitOrder: null
    }
  }
}
