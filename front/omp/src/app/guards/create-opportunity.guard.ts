import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Observable, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreateOpportunityGuard implements CanActivate {
  
  constructor(
    private permissionService: PermissionService, 
    private router: Router
  ) {}
  
  canActivate(): Observable<boolean> {
    return this.permissionService.canCreateOpportunity().pipe(
      tap(canCreate => {
        if (!canCreate) {
          // Redirect to opportunities list if user cannot create
          this.router.navigate(['/layout/opportunites']);
          // Show alert to user
          alert('Vous n\'avez pas les autorisations nécessaires pour créer une opportunité. Seuls les Managers, Senior Managers, Directeurs et Associés peuvent créer des opportunités.');
        }
      })
    );
  }
}
