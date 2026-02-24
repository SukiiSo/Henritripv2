import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-admin-guides-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section style="padding:16px; color:#eef3ff; background:#0f1a33; min-height:100vh;">
      <h1 style="margin:0 0 6px;">Admin guides</h1>
      <p style="margin:0 0 16px;">Gestion des guides, invitations et activités.</p>

      <div style="background:#1b2747; border:1px solid #243864; border-radius:14px; padding:14px;">
        <p style="margin:0 0 8px;">Page à brancher sur les endpoints admin.</p>
        <ul style="margin:0; padding-left:18px; line-height:1.6;">
          <li>GET /api/guides</li>
          <li>POST /api/guides</li>
          <li>PUT /api/guides/{{ '{' }}id{{ '}' }}</li>
          <li>DELETE /api/guides/{{ '{' }}id{{ '}' }}</li>
          <li>PUT /api/guides/{{ '{' }}guideId{{ '}' }}/days/{{ '{' }}dayId{{ '}' }}</li>
          <li>POST /api/guides/{{ '{' }}guideId{{ '}' }}/invitations</li>
          <li>GET /api/guides/{{ '{' }}guideId{{ '}' }}/invitations</li>
          <li>DELETE /api/guides/{{ '{' }}guideId{{ '}' }}/invitations/{{ '{' }}userId{{ '}' }}</li>
          <li>POST /api/guides/{{ '{' }}guideId{{ '}' }}/days/{{ '{' }}dayId{{ '}' }}/activities</li>
          <li>PUT /api/guides/{{ '{' }}guideId{{ '}' }}/days/{{ '{' }}dayId{{ '}' }}/activities/{{ '{' }}activityId{{ '}' }}</li>
          <li>DELETE /api/guides/{{ '{' }}guideId{{ '}' }}/days/{{ '{' }}dayId{{ '}' }}/activities/{{ '{' }}activityId{{ '}' }}</li>
          <li>PATCH /api/guides/{{ '{' }}guideId{{ '}' }}/activities/{{ '{' }}activityId{{ '}' }}/move</li>
        </ul>
      </div>
    </section>
  `
})
export class AdminGuidesPageComponent {}
