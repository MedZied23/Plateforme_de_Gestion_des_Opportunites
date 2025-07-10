import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { PropositionFinanciereDto } from '../../models/proposition-financiere.interface';
import { PaginatedResponse } from '../../models/pagination.interface';
import { PermissionService } from '../../services/permission.service';
import { OpportuniteService, OpportuniteDto } from '../../services/opportunite.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-display-propositions-financieres',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './display-propositions-financieres.component.html',
  styleUrl: './display-propositions-financieres.component.css'
})
export class DisplayPropositionsFinancieresComponent implements OnInit {  
  propositions: PropositionFinanciereDto[] = [];
  loading = true;
  error: string | null = null;
  // Pagination properties
  totalCount = 0;
  pageSize = 6;  // Default page size matching backend default
  pageIndex = 0;
  totalPages = 0;
  // Sorting properties
  sortBy: string = 'lastModified';  // Default sort by last modification date
  sortDirection: string = 'desc'; // Default sort direction (newest first)
  // Track which proposition's options menu is open
  openOptionsMenuId: string | null = null;
  // Permission tracking
  propositionPermissions: Map<string, {canView: boolean, canEdit: boolean, canDelete: boolean}> = new Map();
  linkedOpportunities: Map<string, OpportuniteDto> = new Map();
  canCreateProposition = false;

  constructor(
    private propositionFinanciereService: PropositionFinanciereService,
    private router: Router,
    private permissionService: PermissionService,
    private opportuniteService: OpportuniteService
  ) {}
  ngOnInit(): void {
    this.checkCreatePermission();
    this.loadPropositionsFinancieres();
  }

  checkCreatePermission(): void {
    this.permissionService.canCreatePropositionFinanciere().subscribe({
      next: (canCreate) => {
        this.canCreateProposition = canCreate;
      },
      error: (err) => {
        console.error('Error checking create permission:', err);
        this.canCreateProposition = false;
      }
    });
  }

  loadPropositionsFinancieres(): void {
    this.loading = true;
    this.error = null;

    // Using 1-based index for the API call (pageIndex + 1)
    this.propositionFinanciereService.getPropositionsFinancieres(
      this.pageIndex + 1, 
      this.pageSize,
      this.sortBy,
      this.sortDirection    ).subscribe({
      next: (response) => {
        this.propositions = response.items;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.loading = false;
        // Load permissions for each proposition
        this.loadPropositionPermissions();
      },
      error: (err) => {
        console.error('Error fetching propositions financières:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = 'Vous n\'avez pas les autorisations nécessaires pour voir les propositions financières.';
        } else {
          this.error = 'Erreur lors du chargement des propositions financières.';
        }        this.loading = false;
      }
    });
  }  loadPropositionPermissions(): void {
    if (this.propositions.length === 0) return;

    // First, get linked opportunities for all propositions that have an opportunity
    const opportunityChecks = this.propositions.map(proposition => {
      // Check if the proposition is linked to an opportunity
      return this.opportuniteService.getOpportuniteByPropositionFinanciereId(proposition.id).pipe(
        switchMap(response => {
          // The API returns the opportunityId directly or wrapped in an object with 'value' property
          const opportunityId = typeof response === 'string' ? response : 
                               response && typeof response === 'object' && 'value' in response ? response.value : 
                               null;
          
          if (opportunityId) {
            // Get the full opportunity data
            return this.opportuniteService.getOpportuniteById(opportunityId);
          } else {
            // No linked opportunity
            return of(undefined);
          }
        }),
        catchError(err => {
          console.error(`Error getting linked opportunity for proposition ${proposition.id}:`, err);
          return of(undefined);
        })
      );
    });

    forkJoin(opportunityChecks).subscribe({
      next: (opportunities) => {
        // Store linked opportunities for reference
        opportunities.forEach((opportunity, index) => {
          if (opportunity) {
            this.linkedOpportunities.set(this.propositions[index].id, opportunity);
          }
        });

        // Check permissions for each proposition
        const permissionChecks = this.propositions.map((proposition, index) => {
          const linkedOpportunity = opportunities[index];
          
          return forkJoin({
            canView: this.permissionService.canViewPropositionFinanciere(proposition, linkedOpportunity),
            canEdit: this.permissionService.canEditPropositionFinanciere(proposition, linkedOpportunity),
            canDelete: this.permissionService.canDeletePropositionFinanciere(proposition, linkedOpportunity)
          }).pipe(
            map(permissions => ({
              propositionId: proposition.id,
              permissions
            })),
            catchError(err => {
              console.error(`Error checking permissions for proposition ${proposition.id}:`, err);
              return of({
                propositionId: proposition.id,
                permissions: { canView: false, canEdit: false, canDelete: false }
              });
            })
          );
        });

        forkJoin(permissionChecks).subscribe({
          next: (results) => {
            results.forEach(result => {
              this.propositionPermissions.set(result.propositionId, result.permissions);
            });
          },
          error: (err) => {
            console.error('Error loading proposition permissions:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error loading linked opportunities:', err);
      }
    });
  }

  canViewProposition(propositionId: string): boolean {
    return this.propositionPermissions.get(propositionId)?.canView ?? false;
  }

  canEditProposition(propositionId: string): boolean {
    return this.propositionPermissions.get(propositionId)?.canEdit ?? false;
  }

  canDeleteProposition(propositionId: string): boolean {
    return this.propositionPermissions.get(propositionId)?.canDelete ?? false;
  }

  navigateToOffreFinanciere(propositionId: string): void {
    // Navigate with query parameters instead of state to ensure persistence
    this.router.navigate(['/layout/offre-financiere'], {
      queryParams: { propositionId: propositionId }
    });
  }
  deleteProposition(event: Event, propositionId: string): void {
    // Stop the event from propagating to parent (prevent navigation)
    event.stopPropagation();
    
    // Check if user has permission to delete this proposition
    if (!this.canDeleteProposition(propositionId)) {
      alert('Vous n\'avez pas les autorisations nécessaires pour supprimer cette proposition financière.');
      return;
    }
    
    // You could add confirmation dialog here if desired
    if (confirm('Êtes-vous sûr de vouloir supprimer cette proposition financière ?')) {
      this.propositionFinanciereService.deletePropositionFinanciere(propositionId).subscribe({
        next: () => {
          // Remove the proposition from the local array
          this.propositions = this.propositions.filter(p => p.id !== propositionId);
          console.log('Proposition financière supprimée avec succès');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de la proposition financière:', err);
          if (err.status === 401 || err.status === 403) {
            this.error = 'Vous n\'avez pas les autorisations nécessaires pour supprimer cette proposition financière.';
          } else {
            this.error = 'Erreur lors de la suppression. Veuillez réessayer.';
          }
        }
      });
    }
  }

  // Navigate to the appropriate feuille component based on sheet number
  navigateToFeuilleComponent(event: Event, propositionId: string, sheetNumber: number): void {
    // Stop the event from propagating to parent
    event.stopPropagation();
    
    // Close the options menu
    this.openOptionsMenuId = null;
    
    // Navigate based on the sheet number
    if (sheetNumber === 1) {
      // Navigate to the display-feuil-one component for sheet 1
      this.router.navigate(['/layout/display-feuil-one'], {
        queryParams: { 
          propositionId: propositionId
        }
      });
    } else if (sheetNumber === 2) {
      // Navigate to the display-feuil-two component for sheet 2
      this.router.navigate(['/layout/display-feuil-two'], {
        queryParams: { 
          propositionId: propositionId
        }
      });
    } else {
      // For sheet 3, navigate to the display-final-cost component
      this.router.navigate(['/layout/display-final-cost'], {
        queryParams: { 
          propositionId: propositionId
        }
      });
    }
  }

  // Navigate to the scope setup page to reset profiles, phases, and delivrables
  navigateToScopeSetup(event: Event, propositionId: string): void {
    // Stop the event from propagating to parent
    event.stopPropagation();
    
    // Close the options menu
    this.openOptionsMenuId = null;
    
    // Navigate to the same path as when clicking on the card
    this.router.navigate(['/layout/offre-financiere'], {
      queryParams: { 
        propositionId: propositionId
      }
    });
  }

  // Edit a specific sheet of a proposition
  editSheet(event: Event, propositionId: string, sheetNumber: number): void {
    // Stop the event from propagating to parent
    event.stopPropagation();
    
    // Close the options menu
    this.openOptionsMenuId = null;
    
    // Special case for Feuille 1
    if (sheetNumber === 1) {
      // First, navigate to offre-financiere (same as "modifier la portée")
      this.router.navigate(['/layout/offre-financiere'], {
        queryParams: { 
          propositionId: propositionId,
          autoConfigureHJ: 'true' // Add a flag to auto-click the "Définir la distribution des HJ" button
        }
      });
    } 
    // Special case for Feuille 2 - navigate to configure-siege-terrain with query params
    else if (sheetNumber === 2) {
      this.router.navigate(['/layout/configure-siege-terrain'], {
        queryParams: { 
          propositionId: propositionId,
          matrixSubmitted: 'true'
        }
      });
    }
    else {
      // For sheet 3, navigate to the setting-depenses component
      this.router.navigate(['/layout/setting-depenses'], {
        queryParams: { 
          propositionId: propositionId
        }
      });
    }
  }
  navigateToCreateProposition(): void {
    // Check if user has permission to create propositions
    if (!this.canCreateProposition) {
      alert('Vous n\'avez pas les autorisations nécessaires pour créer une proposition financière. Seuls les Managers et les rôles supérieurs peuvent créer des propositions.');
      return;
    }
    
    // Navigate to the create proposition financière page
    this.router.navigate(['/layout/offre-financiere'], {
      queryParams: { mode: 'create' }
    });
  }

  // Toggle the options menu for a proposition
  toggleOptionsMenu(event: Event, propositionId: string): void {
    event.stopPropagation();
    
    // If the same menu is clicked again, close it
    if (this.openOptionsMenuId === propositionId) {
      this.openOptionsMenuId = null;
    } else {
      this.openOptionsMenuId = propositionId;
    }
  }

  // Close the options menu when clicking outside
  @HostListener('document:click', ['$event'])
  closeOptionsMenu(event: MouseEvent): void {
    if (this.openOptionsMenuId && 
        !(event.target as Element).closest('.options-menu')) {
      this.openOptionsMenuId = null;
    }
  }

  // Helper methods to display information in the UI
  getPropositionLabel(proposition: PropositionFinanciereDto): string {
    return `Proposition #${proposition.id}`;
  }

  getPropositionDetails(proposition: PropositionFinanciereDto): string {    const details = [];
    
    if (proposition.totalCost) {
      details.push(`Coût total: ${proposition.totalCost.toLocaleString()}`);
    }
    
    if (proposition.sumHJ) {
      details.push(`Total HJ: ${proposition.sumHJ}`);
    }
    
    if (proposition.nbrSemaines) {
      details.push(`Durée: ${proposition.nbrSemaines} semaines`);
    }
    
    return details.join(' | ') || 'Détails non disponibles';
  }  /**
   * Handles page change events from the custom paginator
   * @param pageIndex The new page index
   * @param pageSize The new page size or event if from select
   */
  onPageChange(pageIndex: number, pageSizeOrEvent: number | Event): void {
    // If pageSizeOrEvent is an Event, extract the value from the event target
    if (pageSizeOrEvent instanceof Event) {
      const target = pageSizeOrEvent.target as HTMLSelectElement;
      this.pageSize = +target.value;
    } else {
      this.pageSize = pageSizeOrEvent;
    }
    
    this.pageIndex = pageIndex;
    this.loadPropositionsFinancieres();
  }
}
