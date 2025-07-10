import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, of } from 'rxjs';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class RegularUserGuard implements CanActivate {
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
        // Check if user is NOT admin (role != 0)
        // Regular users have roles 1-8 (Associé, Directeur, SeniorManager, Manager, AssistantManager, Senior, Junior, User)
        if (user && user.role !== 0) {
          return true;
        } else {
          // If user is admin, redirect to admin routes
          this.router.navigate(['/layout/admin/users']);
          return false;
        }
      })
    );
  }
}
