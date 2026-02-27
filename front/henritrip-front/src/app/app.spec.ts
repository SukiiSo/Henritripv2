import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { AppComponent } from './app.component'
import { AuthService } from './core/auth/auth.service'

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => false,
            isAdmin: () => false,
            getCurrentUser: () => null,
            logout: () => {}
          }
        }
      ]
    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    expect(fixture.componentInstance).toBeTruthy()
  })
})
