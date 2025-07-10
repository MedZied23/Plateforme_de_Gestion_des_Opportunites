import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Role } from '../models/role.enum';
import { OpportuniteDto } from './opportunite.service';
import { PropositionFinanciereDto } from '../models/proposition-financiere.interface';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(private authService: AuthService) {}  // Check if user can create opportunities
  canCreateOpportunity(): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        console.log('PermissionService: Checking create opportunity permission for user:', user);
        
        if (!user) {
          console.log('PermissionService: No user found - denying permission');
          return false;
        }
        
        if (user.role === undefined || user.role === null) {
          console.warn('PermissionService: User role is undefined/null - allowing creation temporarily for debugging');
          // TEMPORARY: Allow creation if role is undefined (for debugging purposes)
          return true;
        }
        
        // Only Manager (4), Senior Manager (3), Director (2), and Associé (1) can create opportunities
        const allowedRoles = [1, 2, 3, 4]; // Associé, Directeur, SeniorManager, Manager
        const hasPermission = allowedRoles.includes(user.role);
        
        console.log(`PermissionService: User role ${user.role}, can create opportunity: ${hasPermission}`);
        return hasPermission;
      }),
      catchError((error) => {
        console.error('PermissionService: Error checking create opportunity permission:', error);
        // TEMPORARY: Return true on error for debugging
        return of(true);
      })
    );
  }
  // Check if user can edit a specific opportunity
  canEditOpportunity(opportunity: OpportuniteDto): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user || !user.id) return false;
        
        // Only associé en charge, senior manager en charge, manager en charge, and co-manager en charge can edit
        return user.id === opportunity.associeEnCharge ||
               user.id === opportunity.seniorManagerEnCharge ||
               user.id === opportunity.managerEnCharge ||
               user.id === opportunity.coManagerEnCharge;
      }),
      catchError(() => of(false))
    );
  }
  // Check if user can delete a specific opportunity  
  canDeleteOpportunity(opportunity: OpportuniteDto): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user || !user.id) return false;
        
        // Only associé en charge, senior manager en charge, manager en charge, and co-manager en charge can delete
        return user.id === opportunity.associeEnCharge ||
               user.id === opportunity.seniorManagerEnCharge ||
               user.id === opportunity.managerEnCharge ||
               user.id === opportunity.coManagerEnCharge;
      }),
      catchError(() => of(false))
    );
  }  // Check if user is part of an opportunity team (for viewing)
  isPartOfOpportunity(opportunity: OpportuniteDto): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user || user.id === undefined || user.id === null) {
          return false;
        }
        
        const userId = user.id;
        
        // User is part of opportunity if they are in any of these roles
        const isInCharge = opportunity.associeEnCharge === userId ||
                          opportunity.seniorManagerEnCharge === userId ||
                          opportunity.managerEnCharge === userId ||
                          opportunity.coManagerEnCharge === userId;
        
        const isInTeam = opportunity.equipeProjet && 
                        Array.isArray(opportunity.equipeProjet) && 
                        opportunity.equipeProjet.includes(userId);
        
        return isInCharge || (isInTeam || false);
      }),
      catchError(() => of(false))
    );
  }

  // Check if user can create proposition financiere (Manager+ roles only)
  canCreatePropositionFinanciere(): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        console.log('PermissionService: Checking create proposition financiere permission for user:', user);
        
        if (!user) {
          console.log('PermissionService: No user found - denying permission');
          return false;
        }
        
        if (user.role === undefined || user.role === null) {
          console.warn('PermissionService: User role is undefined/null - denying creation');
          return false;
        }
        
        // Only Manager (4), Senior Manager (3), Director (2), and Associé (1) can create propositions
        const allowedRoles = [1, 2, 3, 4]; // Associé, Directeur, SeniorManager, Manager
        const hasPermission = allowedRoles.includes(user.role);
        
        console.log(`PermissionService: User role ${user.role}, can create proposition financiere: ${hasPermission}`);
        return hasPermission;
      }),
      catchError((error) => {
        console.error('PermissionService: Error checking create proposition financiere permission:', error);
        return of(false);
      })
    );
  }

  // Check if user can view a specific proposition financiere
  canViewPropositionFinanciere(proposition: PropositionFinanciereDto, linkedOpportunity?: OpportuniteDto): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user || !user.id) return false;
        
        // If proposition is linked to an opportunity, check opportunity team access
        if (linkedOpportunity) {
          return user.id === linkedOpportunity.associeEnCharge ||
                 user.id === linkedOpportunity.seniorManagerEnCharge ||
                 user.id === linkedOpportunity.managerEnCharge ||
                 user.id === linkedOpportunity.coManagerEnCharge;
        }
          // If not linked to opportunity, only creator can view
        return proposition.createdBy === user.id;
      }),
      catchError(() => of(false))
    );
  }

  // Check if user can edit a specific proposition financiere
  canEditPropositionFinanciere(proposition: PropositionFinanciereDto, linkedOpportunity?: OpportuniteDto): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user || !user.id) return false;
        
        // If proposition is linked to an opportunity, check opportunity team access
        if (linkedOpportunity) {
          return user.id === linkedOpportunity.associeEnCharge ||
                 user.id === linkedOpportunity.seniorManagerEnCharge ||
                 user.id === linkedOpportunity.managerEnCharge ||
                 user.id === linkedOpportunity.coManagerEnCharge;
        }
        
        // If not linked to opportunity, only creator can edit
        return proposition.createdBy === user.id;
      }),
      catchError(() => of(false))
    );
  }

  // Check if user can delete a specific proposition financiere
  canDeletePropositionFinanciere(proposition: PropositionFinanciereDto, linkedOpportunity?: OpportuniteDto): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user || !user.id) return false;
        
        // If proposition is linked to an opportunity, check opportunity team access
        if (linkedOpportunity) {
          return user.id === linkedOpportunity.associeEnCharge ||
                 user.id === linkedOpportunity.seniorManagerEnCharge ||
                 user.id === linkedOpportunity.managerEnCharge ||
                 user.id === linkedOpportunity.coManagerEnCharge;
        }
        
        // If not linked to opportunity, only creator can delete
        return proposition.createdBy === user.id;
      }),
      catchError(() => of(false))
    );
  }
}
