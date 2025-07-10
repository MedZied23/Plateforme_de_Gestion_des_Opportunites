import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AddLivrableComponent, LivrableOutput } from '../add-livrable/add-livrable.component';
import { GestionProfilsComponent } from '../gestion-profils/gestion-profils.component';
import { LiaisonOpportuniteComponentComponent } from '../liaison-opportunite-component/liaison-opportunite-component.component';
import { OpportuniteService, OpportuniteDto } from '../../services/opportunite.service';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { PropositionFinanciereDto } from '../../models/proposition-financiere.interface';
import { DisplayFeuilOneComponent } from '../display-feuil-one/display-feuil-one.component';
import { ConfigureSiegeTerrainComponent } from '../configure-siege-terrain/configure-siege-terrain.component';
import { FinancialNavigationComponent } from '../financial-navigation/financial-navigation.component';
import { LivrableService } from '../../services/livrable.service';
import { PermissionService } from '../../services/permission.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Profile {
  id: number;
  name: string;
  nomPrenom?: string;
  poste?: string;
  tjm?: number;
  entite?: string;
  userId?: string;
}

interface Livrable {
  id: number;
  name: string;
  weeks: number;  // Changed from days to weeks
  phaseId?: number;
}

@Component({
  selector: 'app-offre-financiere',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatDialogModule,
    AddLivrableComponent,
    GestionProfilsComponent,
    LiaisonOpportuniteComponentComponent,
    DisplayFeuilOneComponent,
    ConfigureSiegeTerrainComponent,
    FinancialNavigationComponent
  ],
  templateUrl: './offre-financiere.component.html',
  styleUrl: './offre-financiere.component.css'
})
export class OffreFinanciereComponent implements OnInit, AfterViewInit {
  @ViewChild(AddLivrableComponent) addLivrableComponent!: AddLivrableComponent;
  @ViewChild(GestionProfilsComponent) gestionProfilsComponent!: GestionProfilsComponent;
    livrables: Livrable[] = [];
  isLinkedToOpportunity: boolean = false;
  profiles: Profile[] = [];
  currentOpportunity: OpportuniteDto | null = null;
  currentPropositionId: string = ''; // Added to store the proposition financiere ID
  propositionCreated: boolean = false; // Flag to track if proposition has been created
  loadingProposition: boolean = false; // Flag to track if a proposition is being loaded
  showFeuilOne: boolean = false; // Flag to control display-feuil-one visibility
  showConfigureSiegeTerrain: boolean = false; // Flag to control configure-siege-terrain visibility
  propositionName: string = ''; // Pour stocker le nom de la proposition financière
  canCreateProposition = false;
  canEditProposition = false;
  loadingPermissions = true;
  constructor(
    public router: Router,
    private route: ActivatedRoute, // Added ActivatedRoute to access query parameters
    private opportuniteService: OpportuniteService,
    private propositionFinanciereService: PropositionFinanciereService,
    private livrableService: LivrableService, // Add the livrable service
    private permissionService: PermissionService
  ) {}
  ngOnInit() {
    // Check permissions first
    this.checkPermissions();
    
    // Check for query parameters first
    this.route.queryParams.subscribe(params => {
      if (params['propositionId']) {
        this.currentPropositionId = params['propositionId'];
        this.propositionCreated = true;
        // Check if matrix was submitted
        this.showFeuilOne = params['matrixSubmitted'] === 'true';
        this.loadExistingProposition(this.currentPropositionId);
        console.log('Received proposition ID from query params:', this.currentPropositionId);
        console.log('Show feuilOne:', this.showFeuilOne);
        
        // Check if we need to auto-click the "Définir la distribution des HJ" button
        if (params['autoConfigureHJ'] === 'true') {
          console.log('Auto-configure HJ flag detected, will redirect to matrix when data is ready');
          // We need to wait for proposition data to be loaded before redirecting
          this.loadingProposition = true;
          // Use setTimeout to ensure all data is loaded before redirecting
          setTimeout(() => {
            if (this.hasProfilesAndLivrables()) {
              console.log('Auto-redirecting to matrix (Définir la distribution des HJ)');
              this.redirectToMatrix();
            } else {
              console.warn('Unable to auto-redirect to matrix: missing profiles or livrables');
            }
          }, 1000); // Wait a bit longer to ensure data is loaded
        }
      } else {
        // Fallback to check navigation state if no query params
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state) {
          const state = navigation.extras.state as { propositionId: string; matrixSubmitted?: boolean };
          if (state.propositionId) {
            this.currentPropositionId = state.propositionId;
            this.propositionCreated = true;
            // Check if matrix was submitted from navigation state
            this.showFeuilOne = state.matrixSubmitted === true;
            this.loadExistingProposition(this.currentPropositionId);
            console.log('Received proposition ID from navigation state:', this.currentPropositionId);
            console.log('Show feuilOne:', this.showFeuilOne);
          }
        }
      }
    });
  }

  ngAfterViewInit() {
    // After view is initialized and if we have a proposition ID, 
    // wait a bit for child components to be ready then apply the data
    if (this.currentPropositionId && this.addLivrableComponent && this.gestionProfilsComponent) {
      setTimeout(() => {
        // The data should already be loaded by loadExistingProposition
        this.applyLoadedPropositionData();
      }, 500); // Short delay to ensure components are ready
    }
  }
  checkPermissions(): void {
    // Check create permission
    this.permissionService.canCreatePropositionFinanciere().subscribe({
      next: (canCreate) => {
        this.canCreateProposition = canCreate;
        this.loadingPermissions = false;
        
        // If user doesn't have permission and is trying to create a new proposition (no existing propositionId)
        if (!canCreate && !this.currentPropositionId) {
          console.warn('User does not have permission to create financial propositions');
          // Show user-friendly message and redirect
          alert('Vous n\'avez pas les autorisations nécessaires pour créer une proposition financière. Seuls les Managers, Senior Managers, Directeurs et Associés peuvent créer des propositions financières.');
          this.router.navigate(['/layout/propositions-financieres']);
          return;
        }
      },
      error: (err) => {
        console.error('Error checking create permission:', err);
        this.canCreateProposition = false;
        this.loadingPermissions = false;
        
        // If there's an error checking permissions and no existing proposition, redirect
        if (!this.currentPropositionId) {
          alert('Erreur lors de la vérification des autorisations. Veuillez réessayer.');
          this.router.navigate(['/layout/propositions-financieres']);
          return;
        }
      }
    });

    // Check edit permission if we have a proposition ID
    if (this.currentPropositionId) {
      // We'll check edit permissions when we load the proposition data
      // For now, assume we can edit until we know otherwise
      this.canEditProposition = true;
    }
  }

  loadExistingProposition(propositionId: string): void {
    // Prevent loading the same proposition multiple times
    if (this.loadingProposition) {
      console.log('[OffreFinanciereComponent] Already loading proposition, skipping duplicate request');
      return;
    }
    
    this.loadingProposition = true;
    
    // Load the proposition financière details
    this.propositionFinanciereService.getPropositionFinanciereById(propositionId).subscribe({
      next: (proposition) => {
        console.log('[OffreFinanciereComponent] Loaded proposition:', proposition);
        // Store the proposition data
        this.currentPropositionId = proposition.id;
        this.propositionCreated = true;
        
        // Always assign the nom property directly from the proposition object
        this.propositionName = proposition.nom || '';
        console.log('[OffreFinanciereComponent] Loaded proposition name:', this.propositionName);
        
        // Extract livrables if available
        if (proposition.livrables && proposition.livrables.length > 0) {
          this.loadLivrablesForProposition(proposition);
        }
        
        // Extract profiles if available
        if (proposition.profils && proposition.profils.length > 0) {
          this.loadProfilesForProposition(proposition);
        }
        
        // Only check opportunity link if we don't already have opportunity data
        // This breaks the potential circular reference
        if (!this.currentOpportunity) {
          this.checkPropositionLinkedToOpportunity(propositionId);
        } else {
          this.loadingProposition = false;
        }
      },
      error: (error) => {
        console.error('Error loading proposition financière:', error);
        this.loadingProposition = false;
      }
    });
  }

  // Updated method to load livrables based on proposition data
  private loadLivrablesForProposition(proposition: PropositionFinanciereDto): void {
    if (!this.currentPropositionId) {
      console.warn('No proposition ID available, cannot load livrables');
      return;
    }

    // Use the new endpoint to fetch all livrables for this proposition
    this.livrableService.getLivrablesByPropositionFinanciereId(this.currentPropositionId)
      .pipe(
        catchError(error => {
          console.error('Error loading livrables for proposition:', error);
          return of([]);
        })
      )
      .subscribe(livrables => {
        if (livrables && livrables.length > 0) {
          console.log(`Loaded ${livrables.length} actual livrables for proposition ${this.currentPropositionId}`);
          
          // Map the livrable DTOs to the UI model
          this.livrables = livrables.map(livrable => ({
            id: parseInt(livrable.id), // Convert GUID to number (not ideal, but works for UI)
            name: livrable.nom || `Livrable sans nom`,
            weeks: livrable.duration || (livrable.endWeek && livrable.startWeek ? 
                   livrable.endWeek - livrable.startWeek + 1 : 1),
            phaseId: livrable.idPhase ? parseInt(livrable.idPhase) : undefined
          }));
          
          console.log('Processed actual livrables:', this.livrables);
        } else {
          console.log('No livrables found for proposition ID:', this.currentPropositionId);
          
          // Fall back to creating placeholder livrables from IDs if needed
          if (proposition.livrables && proposition.livrables.length > 0) {
            this.livrables = proposition.livrables.map((livrableId, index) => ({
              id: index + 1,
              name: `Livrable ${livrableId} (placeholder)`,
              weeks: proposition.nbrSemaines || 1,
              phaseId: undefined
            }));
            console.log('Created placeholder livrables as fallback');
          } else {
            this.livrables = []; // Clear livrables if none found
          }
        }
      });
  }

  // Helper method to load profiles based on proposition data
  private loadProfilesForProposition(proposition: PropositionFinanciereDto): void {
    if (proposition.profils) {
      this.profiles = proposition.profils.map((profileId, index) => ({
        id: index + 1,
        name: `Profil ${profileId}`,
        entite: 'EY'
      }));
    }
  }
  // Apply loaded data to child components
  private applyLoadedPropositionData(): void {
    if (this.addLivrableComponent && this.livrables.length > 0) {
      console.log('[OffreFinanciereComponent] Setting livrables in child component:', this.livrables);
    }
    
    if (this.gestionProfilsComponent && this.currentPropositionId) {
      console.log('[OffreFinanciereComponent] Setting proposition ID in GestionProfilsComponent:', this.currentPropositionId);
      this.gestionProfilsComponent.propositionFinanciereId = this.currentPropositionId;
      
      // If we have an opportunity linked, also update the component with opportunity data
      if (this.isLinkedToOpportunity && this.currentOpportunity) {
        console.log('[OffreFinanciereComponent] Updating GestionProfilsComponent with linked opportunity data');
        this.gestionProfilsComponent.opportunityData = this.currentOpportunity;
      }
    }
  }
  onOpportunityLinked(opportunityId: string) {
    this.isLinkedToOpportunity = true;
    
    // If we already have a proposition ID, link it to the selected opportunity
    if (this.currentPropositionId) {
      console.log('[OffreFinanciereComponent] Linking existing proposition to opportunity:', {
        propositionId: this.currentPropositionId,
        opportunityId: opportunityId
      });
      
      // Load the opportunity data first
      this.opportuniteService.getOpportuniteById(opportunityId).subscribe({
        next: (opportunity) => {
          // Update the opportunity with the current proposition ID
          const updatedOpportunity = { ...opportunity, idPropositionFinanciere: this.currentPropositionId };
          
          this.opportuniteService.updateOpportunite(opportunityId, updatedOpportunity).subscribe({
            next: (updatedOpportunityData) => {
              console.log('[OffreFinanciereComponent] Successfully linked existing proposition to opportunity');
              this.currentOpportunity = updatedOpportunityData;
              
              // Redirect to modifier la portée page with the proposition ID
              console.log('[OffreFinanciereComponent] Redirecting to modifier la portée page for proposition:', this.currentPropositionId);
              this.router.navigate(['/layout/offre-financiere'], {
                queryParams: { 
                  propositionId: this.currentPropositionId
                }
              });
            },
            error: (error) => {
              console.error('[OffreFinanciereComponent] Error linking existing proposition to opportunity:', error);
            }
          });
        },
        error: (error) => {
          console.error('[OffreFinanciereComponent] Error loading opportunity for linking:', error);
        }
      });
    } else {
      // If we don't have a proposition ID yet, load the opportunity data to potentially create and link
      this.loadOpportunityData(opportunityId, true);
    }
  }  private loadOpportunityData(opportunityId: string, shouldLinkToProposition: boolean = false) {
    console.log(`[OffreFinanciereComponent] Loading opportunity data for ID: ${opportunityId}, shouldLinkToProposition: ${shouldLinkToProposition}`);
    
    // Prevent duplicate loads
    if (this.currentOpportunity && this.currentOpportunity.id === opportunityId) {
      console.log('[OffreFinanciereComponent] Already loaded this opportunity, skipping duplicate request');
      this.loadingProposition = false;
      return;
    }
    
    this.opportuniteService.getOpportuniteById(opportunityId).subscribe({
      next: (opportunity) => {
        console.log('[OffreFinanciereComponent] Loaded opportunity:', opportunity);
        this.currentOpportunity = opportunity;
        this.isLinkedToOpportunity = true; // Make sure the flag is set here
        
        // If the opportunity already has a linked proposition, load it
        if (opportunity.idPropositionFinanciere) {
          console.log('[OffreFinanciereComponent] Opportunity already has a linked proposition:', opportunity.idPropositionFinanciere);
          
          // Only load the proposition if it's different from the current one
          // This helps break the circular reference
          if (this.currentPropositionId !== opportunity.idPropositionFinanciere) {
            this.currentPropositionId = opportunity.idPropositionFinanciere;
            this.propositionCreated = true;
            this.loadExistingProposition(this.currentPropositionId);
            
            // If we are linking to a proposition, redirect to modifier la portée page
            if (shouldLinkToProposition) {
              console.log('[OffreFinanciereComponent] Redirecting to modifier la portée page for existing proposition:', opportunity.idPropositionFinanciere);
              this.router.navigate(['/layout/offre-financiere'], {
                queryParams: { 
                  propositionId: opportunity.idPropositionFinanciere
                }
              });
            }
          } else {
            // We already have this proposition loaded, so just mark loading as complete
            this.loadingProposition = false;
          }
        } 
        // If it should be linked to a proposition but doesn't have one yet
        else if (shouldLinkToProposition) {
          console.log('[OffreFinanciereComponent] Creating and linking new proposition for opportunity');
          this.createAndLinkProposition(opportunity);
        } else {
          this.loadingProposition = false;
        }
        
        if (this.gestionProfilsComponent) {
          this.gestionProfilsComponent.linkedOpportunityProfiles = [];
          this.gestionProfilsComponent.opportunityData = opportunity;
        }
        
        if (!shouldLinkToProposition && !opportunity.idPropositionFinanciere) {
          this.loadingProposition = false;
        }
      },
      error: (error) => {
        console.error('Error loading opportunity:', error);
        this.loadingProposition = false;
      }
    });
  }

  /**
   * Creates a new proposition financière and links it to the opportunity
   * @param opportunity The opportunity to link the proposition to
   */
  private createAndLinkProposition(opportunity: OpportuniteDto): void {
    // Create a new proposition with the name based on the opportunity
    const propositionName = `${opportunity.nomOpportunite} - Proposition Financiere`;
    
    const newProposition: Omit<PropositionFinanciereDto, 'id'> = {
      nom: propositionName,
      dateCreation: new Date(),
      dateModification: new Date()
    };
    
    this.propositionFinanciereService.createPropositionFinanciere(newProposition).subscribe({
      next: (result) => {
        // The result could be a string ID or the full PropositionFinanciereDto
        const propositionId = typeof result === 'string' ? result : result.id;
        this.currentPropositionId = propositionId;
        this.propositionName = propositionName;
        this.propositionCreated = true;
        
        console.log('[OffreFinanciereComponent] Created new proposition financière with ID:', propositionId);
          // Now link the proposition to the opportunity by directly updating the opportunity
        // Create a copy of the current opportunity and set the proposition ID
        const updatedOpportunity = { ...opportunity, idPropositionFinanciere: propositionId };
        console.log('[OffreFinanciereComponent] Updating opportunity with proposition ID:', propositionId);
        
        this.opportuniteService.updateOpportunite(opportunity.id, updatedOpportunity).subscribe({
          next: (updatedOpportunityData) => {
            console.log('[OffreFinanciereComponent] Linked proposition to opportunity successfully:', updatedOpportunityData);
            this.currentOpportunity = updatedOpportunityData;
            
            // Update the GestionProfilsComponent with the new proposition ID
            if (this.gestionProfilsComponent) {
              this.gestionProfilsComponent.propositionFinanciereId = propositionId;
            }
            
            // Redirect to "modifier la portée" page of the newly created financial proposal
            console.log('[OffreFinanciereComponent] Redirecting to modifier la portée page for proposition:', propositionId);
            this.router.navigate(['/layout/offre-financiere'], {
              queryParams: { 
                propositionId: propositionId
              }
            });
          },
          error: (error) => {
            console.error('[OffreFinanciereComponent] Error linking proposition to opportunity:', error);
          }
        });
      },
      error: (error) => {
        console.error('[OffreFinanciereComponent] Error creating proposition financière:', error);
      }
    });
  }  onOpportunityUnlinked() {
    // Only update if we have an actual opportunity that was linked
    if (this.currentOpportunity && this.isLinkedToOpportunity) {
      // Create a copy of the current opportunity with the idPropositionFinanciere set to undefined
      const updatedOpportunity = { ...this.currentOpportunity, idPropositionFinanciere: undefined };
      
      this.opportuniteService.updateOpportunite(this.currentOpportunity.id, updatedOpportunity).subscribe({
        next: (updatedOpportunityData) => {
          console.log('[OffreFinanciereComponent] Unlinked proposition from opportunity successfully');
          // We keep the proposition financière and its ID, just unlink from the opportunity
          // This is what was requested: "when i unlink the idPropositionFinanciere in Opportunite becomes null while the proposition financiere still exists"
        },
        error: (error) => {
          console.error('[OffreFinanciereComponent] Error unlinking proposition from opportunity:', error);
        }
      });
    }

    this.isLinkedToOpportunity = false;
    this.currentOpportunity = null;
    if (this.gestionProfilsComponent) {
      this.gestionProfilsComponent.linkedOpportunityProfiles = [];
      this.gestionProfilsComponent.opportunityData = null;
      this.gestionProfilsComponent.resetFilters();
    }
  }

  onLivrablesConfirmed(configureLivrables: LivrableOutput[]): void {
    console.log('[OffreFinanciereComponent] Received livrables:', configureLivrables);
    this.livrables = configureLivrables.map(livrable => ({
      id: livrable.id,
      name: livrable.name,
      weeks: livrable.weeks,
      phaseId: livrable.phaseId
    }));
    console.log('[OffreFinanciereComponent] Processed livrables:', this.livrables);
  }

  updateProfilesFromComponent(): void {
    if (this.gestionProfilsComponent) {
      this.profiles = [...this.gestionProfilsComponent.profiles];
    }
  }

  hasProfilesAndLivrables(): boolean {
    return this.profiles.length > 0 && this.livrables.length > 0;
  }

  redirectToMatrix(): void {
    if (this.hasProfilesAndLivrables()) {
      let profileDtos = [];
      if (this.gestionProfilsComponent && this.currentPropositionId) {
        this.propositionFinanciereService.getPropositionFinanciereById(this.currentPropositionId)
          .subscribe({
            next: (proposition) => {
              this.router.navigate(['/layout/profile-delivrable-matrix'], {
                state: { 
                  profiles: [...this.profiles], 
                  livrables: [...this.livrables],
                  opportunityId: this.currentOpportunity?.id,
                  propositionId: this.currentPropositionId,
                  profileDtos: proposition.profils
                }
              });
            },
            error: (error) => {
              console.error('[OffreFinanciereComponent] Error getting profiles for matrix:', error);
              this.router.navigate(['/layout/profile-delivrable-matrix'], {
                state: { 
                  profiles: [...this.profiles], 
                  livrables: [...this.livrables],
                  opportunityId: this.currentOpportunity?.id,
                  propositionId: this.currentPropositionId
                }
              });
            }
          });
      } else {
        this.router.navigate(['/layout/profile-delivrable-matrix'], {
          state: { 
            profiles: [...this.profiles], 
            livrables: [...this.livrables],
            opportunityId: this.currentOpportunity?.id,
            propositionId: this.currentPropositionId
          }
        });
      }
    }
  }

  // Added method to navigate to Siege/Terrain configuration
  redirectToSiegeTerrain(): void {
    if (this.hasProfilesAndLivrables() && this.currentPropositionId) {
      this.router.navigate(['/layout/configure-siege-terrain'], {
        state: { 
          propositionId: this.currentPropositionId,
          opportunityId: this.currentOpportunity?.id
        }
      });
    } else {
      console.error('[OffreFinanciereComponent] Cannot redirect to Siege/Terrain - missing proposition ID or profiles/livrables');
    }
  }

  onPropositionFinanciereCreated(propositionId: string): void {
    console.log('[OffreFinanciereComponent] Received proposition financière ID:', propositionId);
    this.currentPropositionId = propositionId;
    this.propositionCreated = true;
  }

  // Method to toggle the visibility of the configure-siege-terrain component
  toggleConfigureSiegeTerrain(): void {
    this.showConfigureSiegeTerrain = !this.showConfigureSiegeTerrain;
    console.log('[OffreFinanciereComponent] Configure siege terrain visibility:', this.showConfigureSiegeTerrain);
  }  private checkPropositionLinkedToOpportunity(propositionId: string): void {
    // Avoid duplicate lookups or lookups when already have the data
    if (this.currentOpportunity) {
      console.log('[OffreFinanciereComponent] Already have opportunity data, skipping lookup');
      this.loadingProposition = false;
      return;
    }
    
    this.opportuniteService.getOpportuniteByPropositionFinanciereId(propositionId).subscribe({
      next: (response) => {
        // The API returns the opportunityId directly or wrapped in an object with 'value' property
        const opportunityId = typeof response === 'string' ? response : 
                             response && typeof response === 'object' && 'value' in response ? response.value : 
                             null;
        
        if (opportunityId) {
          console.log('[OffreFinanciereComponent] Proposition is linked to opportunity ID:', opportunityId);
          this.isLinkedToOpportunity = true;
          
          // Load the opportunity data, but prevent another circular reference
          // by passing false to prevent linking back to the proposition
          this.loadOpportunityData(opportunityId, false);
        } else {
          console.log('[OffreFinanciereComponent] Proposition is not linked to any opportunity');
          this.isLinkedToOpportunity = false;
          this.currentOpportunity = null;
          this.loadingProposition = false;
        }
      },
      error: (error) => {
        console.error('[OffreFinanciereComponent] Error checking if proposition is linked to opportunity:', error);
        this.isLinkedToOpportunity = false;
        this.currentOpportunity = null;
        this.loadingProposition = false;
      }
    });
  }
}
