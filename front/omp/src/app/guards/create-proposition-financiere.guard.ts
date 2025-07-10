import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Observable, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreatePropositionFinanciereGuard implements CanActivate {
  
  constructor(
    private permissionService: PermissionService, 
    private router: Router
  ) {}
  
  canActivate(): Observable<boolean> {
    return this.permissionService.canCreatePropositionFinanciere().pipe(
      tap(canCreate => {
        if (!canCreate) {
          // Redirect to propositions list if user cannot create
          this.router.navigate(['/layout/propositions-financieres']);
          // Show alert to user
          alert('Vous n\'avez pas les autorisations nécessaires pour créer une proposition financière. Seuls les Managers, Senior Managers, Directeurs et Associés peuvent créer des propositions financières.');
        }
      })
    );
  }
}
