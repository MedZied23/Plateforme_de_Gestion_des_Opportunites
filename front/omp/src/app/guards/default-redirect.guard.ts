import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, of } from 'rxjs';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class DefaultRedirectGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Check if user is authenticated first
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // Get user from stored data or decode token
    return this.authService.getCurrentUser().pipe(
      map((user: User) => {
        if (user) {
          // Redirect based on user role
          if (user.role === 0) {
            // Admin user - redirect to admin dashboard
            this.router.navigate(['/layout/admin/users']);
          } else {
            // Regular user - redirect to default regular user page
            this.router.navigate(['/layout/search-cvs']);
          }
        } else {
          // Fallback if user data couldn't be retrieved
          this.router.navigate(['/login']);
        }
        return false; // Always return false since we're redirecting
      })
    );
  }
}
