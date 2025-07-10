import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, of } from 'rxjs';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
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
        // Check for admin role (role = 0 according to Role enum)
        if (user && user.role === 0) {
          return true;
        } else {
          // If user is not admin, redirect to regular user default page
          this.router.navigate(['/layout/search-cvs']);
          return false;
        }
      })
    );
  }
}
