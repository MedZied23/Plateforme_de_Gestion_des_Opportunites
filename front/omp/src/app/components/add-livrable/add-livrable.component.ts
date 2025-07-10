import { Component, Output, EventEmitter, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlertComponent } from '../alert/alert.component';
import { ConfirmComponent } from '../confirm/confirm.component';
import { AddPhaseDialogComponent } from '../add-phase-dialog/add-phase-dialog.component';
import { AddLivrableDialogComponent, LivrableDialogResult } from '../add-livrable-dialog/add-livrable-dialog.component';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { PhaseService } from '../../services/phase.service';
import { LivrableService } from '../../services/livrable.service';
import { Phase } from '../../models/phase.interface';
import { LivrableDto } from '../../models/livrable.interface';
import { catchError, switchMap, map } from 'rxjs/operators';
import { of, forkJoin, Observable } from 'rxjs';

interface LivrableItem {
  id: number;
  startWeek: number;
  endWeek: number;
  name: string;
  phaseId: number;
  backendId?: string; // Store backend ID when available
  phaseNumero?: number; // Store the phase number for sorting
  numero?: number; // The number of the livrable within the phase
}

// Update Phase interface to match backend model
interface PhaseUI {
  id: number;
  name: string;
  livrables: LivrableItem[];
  backendId?: string;  // Store backend ID when available
  numero?: number;     // Store backend numero when available
}

// Define interface for exposing livrables to parent component
export interface LivrableOutput {
  id: number;
  name: string;
  weeks: number;
  startWeek: number;
  endWeek: number;
  phaseId: number;
  phaseNumero?: number; // Add phase number for sorting
  numero?: number;      // Add livrable numero within phase
  backendId?: string;   // Store backend ID for batch update
}

@Component({
  selector: 'app-add-livrable',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './add-livrable.component.html',
  styleUrls: ['./add-livrable.component.css']
})
export class AddLivrableComponent implements OnInit {
  // Add an output event emitter to communicate with the parent component
  @Output() livrablesConfirmed = new EventEmitter<LivrableOutput[]>();
  // Add input for proposition financiere ID
  @Input() propositionId: string = '';
  
  // Make Math available in template
  Math = Math;
    showConfiguration: boolean = false;
  configurationComplete: boolean = false;
  durationMonths: number = 0; // Supports decimal values (e.g., 1.25 = 5 weeks, 2.5 = 10 weeks)
  totalProjectWeeks: number = 0;
  previousTotalProjectWeeks: number = 0;
  showDeliverables: boolean = false;
  phases: PhaseUI[] = [];
  currentPhaseId: number = 0;
  newPhaseName: string = '';
  currentLivrable: LivrableItem | null = null;
  nextLivrableId: number = 1;
  isUpdatingProposition: boolean = false;
  isCreatingPhase: boolean = false;
  isDeletingPhase: boolean = false;
  loadingPhases: boolean = false;

  private propositionFinanciereService = inject(PropositionFinanciereService);
  private phaseService = inject(PhaseService);
  private livrableService = inject(LivrableService);
  
  constructor(private dialog: MatDialog) {}
  
  ngOnInit(): void {
    // If we have a proposition ID, load existing phases from the backend
    if (this.propositionId) {
      this.loadPhasesFromBackend();
    }
  }
  
  // Load existing phases from the backend
  loadPhasesFromBackend(): void {
    this.loadingPhases = true;
    
    // First get the proposition to get nbrSemaines
    this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId)
      .pipe(
        catchError(error => {
          console.error('Error loading proposition:', error);
          this.loadingPhases = false;
          this.showAlert('Erreur lors du chargement de la proposition financière.');
          return of(null);
        }),
        switchMap(proposition => {          if (proposition && proposition.nbrSemaines) {
            // Set duration values from the proposition
            this.durationMonths = proposition.nbrSemaines / 4; // Convert weeks to exact months (support decimals)
            this.totalProjectWeeks = proposition.nbrSemaines;
            
            // Now fetch the phases for this proposition
            return this.phaseService.getPhasesByPropositionId(this.propositionId).pipe(
              map(phases => ({ phases, hasData: phases.length > 0 })),
              catchError(error => {
                console.error('Error loading phases:', error);
                return of({ phases: [], hasData: false });
              })
            );
          }
          
          return of({ phases: [], hasData: false });
        })
      )
      .subscribe(({ phases, hasData }) => {
        if (!phases || phases.length === 0) {
          this.loadingPhases = false;
          console.log('No phases found for proposition ID:', this.propositionId);
          return;
        }

        console.log(`Found ${phases.length} phases for proposition ID: ${this.propositionId}`);

        // Convert backend phases to UI phases first
        const uiPhases: PhaseUI[] = phases.map(bp => {
          return {
            id: bp.numero || this.currentPhaseId + 1, // Use backend numero or increment UI phase ID counter
            name: bp.nom || 'Phase sans nom',
            livrables: [], // We'll load livrables separately
            backendId: bp.id,
            numero: bp.numero
          };
        });
        
        // Update currentPhaseId to be the max ID used
        this.currentPhaseId = Math.max(...uiPhases.map(p => p.id), 0);

        // Instead of loading livrables by phase, load all livrables for the proposition at once
        this.livrableService.getLivrablesByPropositionFinanciereId(this.propositionId)
          .pipe(
            catchError(error => {
              console.error('Error loading livrables for proposition:', error);
              return of([]);
            })
          )
          .subscribe(livrables => {
            this.loadingPhases = false;
            
            if (livrables && livrables.length > 0) {
              console.log(`Received ${livrables.length} livrables for proposition ${this.propositionId}`);
              
              // Group livrables by phase
              const livrablesByPhase = new Map<string, LivrableDto[]>();
              
              livrables.forEach(livrable => {
                if (livrable.idPhase) {
                  const phaseId = livrable.idPhase.toString();
                  if (!livrablesByPhase.has(phaseId)) {
                    livrablesByPhase.set(phaseId, []);
                  }
                  livrablesByPhase.get(phaseId)?.push(livrable);
                }
              });
              
              // Assign livrables to their respective phases
              uiPhases.forEach(phase => {
                if (phase.backendId) {
                  const phaseId = phase.backendId.toString();
                  const phaseLivrables = livrablesByPhase.get(phaseId) || [];
                  
                  if (phaseLivrables.length > 0) {
                    console.log(`Assigning ${phaseLivrables.length} livrables to phase ${phase.id} (backend ID: ${phase.backendId})`);
                    
                    // Convert backend livrables to UI livrables
                    phase.livrables = phaseLivrables.map(livrable => {
                      return {
                        id: this.nextLivrableId++, // Assign a new UI ID and increment
                        name: livrable.nom || 'Livrable sans nom',
                        startWeek: livrable.startWeek || 0,
                        endWeek: livrable.endWeek || 0,
                        phaseId: phase.id,
                        phaseNumero: phase.numero,
                        numero: livrable.numero || 0,
                        backendId: livrable.id
                      };
                    });
                    
                    // Sort livrables by numero
                    phase.livrables.sort((a, b) => (a.numero || 0) - (b.numero || 0));
                  } else {
                    console.log(`No livrables found for phase ${phase.id} (backend ID: ${phase.backendId})`);
                    phase.livrables = [];
                  }
                }
              });
              
              // Update the phases array
              this.phases = uiPhases;
              
              // Sort phases by numero
              this.phases.sort((a, b) => (a.numero || 0) - (b.numero || 0));
              
              // Log the final phases with their livrables for debugging
              console.log('Final phases with livrables:', JSON.parse(JSON.stringify(this.phases)));
              
              // If we have data and first load, automatically show the configuration and deliverables
              if (hasData && this.phases.length > 0) {
                this.showConfiguration = true;
                this.showDeliverables = true;
                this.configurationComplete = true;
                
                // Emit the livrables for parent component to use
                this.emitConfiguredLivrables();
              }
            } else {
              console.log('No livrables found for proposition ID:', this.propositionId);
              this.phases = uiPhases;
              // Sort phases by numero
              this.phases.sort((a, b) => (a.numero || 0) - (b.numero || 0));
            }
          });
      });
  }
  
  // Method to emit the configured livrables to parent component
  private emitConfiguredLivrables(): void {
    const outputLivrables = this.getConfiguredLivrables();
    console.log('[AddLivrableComponent] Auto-emitting configured livrables:', outputLivrables);
    this.livrablesConfirmed.emit(outputLivrables);
  }
  
  // Start configuration process
  startConfiguration(): void {
    this.showConfiguration = true;
    this.configurationComplete = false;
    
    // If we have a proposition ID but no phases loaded yet, load them
    if (this.propositionId && this.phases.length === 0) {
      this.loadPhasesFromBackend();
    }
  }
  
  // Cancel configuration process
  cancelConfiguration(): void {
    this.showConfiguration = false;
    this.configurationComplete = false;
    this.resetConfiguration();
  }
    // Reset all configuration values
  resetConfiguration(): void {
    this.durationMonths = 0;
    this.totalProjectWeeks = 0;
    this.showDeliverables = false;
    this.phases = [];
    this.currentPhaseId = 0;
    this.newPhaseName = '';
    this.currentLivrable = null;
    this.nextLivrableId = 1;
    
    // If we have a proposition ID, reload phases from backend
    if (this.propositionId) {
      this.loadPhasesFromBackend();
    }
  }
  
  showAlert(message: string) {
    this.dialog.open(AlertComponent, {
      data: {
        message: message,
        buttonText: 'OK'
      }
    });
  }
  goToPreviousStep() {
    // Only hide the deliverables view without resetting the duration values
    // Store the current total project weeks when going back to modify duration
    this.previousTotalProjectWeeks = this.totalProjectWeeks;
    this.showDeliverables = false;
  }  onDurationSubmit() {
    // Validate input
    if (!this.durationMonths || this.durationMonths < 0.25) {
      this.showAlert("La durée doit être d'au moins 0.25 mois (1 semaine).");
      return;
    }
    
    if (this.durationMonths >= 0.25) { // Allow minimum of 0.25 months (1 week)
      // Each month has 4 weeks - round to nearest whole number for practical purposes
      const newTotalProjectWeeks = Math.round(this.durationMonths * 4);
      
      // Check if we're shortening the project and if there are existing livrables
      if (this.totalProjectWeeks > 0 && newTotalProjectWeeks < this.totalProjectWeeks && this.hasLivrablesOutsideNewTimeRange(newTotalProjectWeeks)) {
        // Show confirmation dialog
        const dialogRef = this.dialog.open(ConfirmComponent, {
          data: {
            title: 'Attention',
            message: 'La réduction de la durée du projet affectera certains livrables existants. Êtes-vous sûr de vouloir réinitialiser les phases et les livrables?',
            confirmButtonText: 'Oui, réinitialiser',
            cancelButtonText: 'Annuler'
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // User confirmed, update duration and reset phases/livrables
            this.totalProjectWeeks = newTotalProjectWeeks;
            this.resetPhasesAndLivrables();
            this.showDeliverables = true;
            
            // Update the proposition financiere with the new number of weeks
            this.updatePropositionSemaines(newTotalProjectWeeks);
          }
          // If user cancels, do nothing and keep current phases/livrables
        });
      } else {
        // No issues with existing livrables, proceed normally
        this.totalProjectWeeks = newTotalProjectWeeks;
        this.showDeliverables = true;
        
        // Update the proposition financiere with the new number of weeks
        this.updatePropositionSemaines(newTotalProjectWeeks);
      }
    }
  }
  
  // Check if any livrables would fall outside the new project duration
  private hasLivrablesOutsideNewTimeRange(newTotalProjectWeeks: number): boolean {
    for (const phase of this.phases) {
      for (const livrable of phase.livrables) {
        // If the livrable starts or ends after the new project duration, it's affected
        if (livrable.startWeek > newTotalProjectWeeks || livrable.endWeek > newTotalProjectWeeks) {
          return true;
        }
      }
    }
    return false;
  }
  
  // Reset only phases and livrables, but keep the configuration mode
  private resetPhasesAndLivrables(): void {
    // Keep any phases that were loaded from the backend
    const backendPhases = this.phases.filter(p => p.backendId);
    this.phases = [...backendPhases];
    this.currentPhaseId = backendPhases.length > 0 ? Math.max(...backendPhases.map(p => p.id)) : 0;
    this.nextLivrableId = 1;
  }
  showAddPhase() {
    const dialogRef = this.dialog.open(AddPhaseDialogComponent, {
      data: {
        title: 'Nouvelle Phase'
      }
    });

    dialogRef.afterClosed().subscribe(phaseName => {
      if (phaseName) {
        this.newPhaseName = phaseName;
        this.addPhase();
      }
    });
  }

  addPhase() {
    if (!this.newPhaseName.trim()) {
      this.showAlert("Le nom de la phase ne peut pas être vide.");
      return;
    }
    
    if (!this.propositionId) {
      this.showAlert("Impossible d'ajouter une phase sans ID de proposition financière.");
      return;
    }
    
    this.isCreatingPhase = true;
    
    // Increment phase ID first so we can use it as the numero
    this.currentPhaseId++;
    
    // Create a backend phase with numero explicitly set to match the UI id
    const backendPhase: Phase = {
      nom: this.newPhaseName.trim(),
      idPropositionFinanciere: this.propositionId,
      numero: this.currentPhaseId // Set numero to match the UI id
    };
    
    this.phaseService.createPhase(backendPhase)
      .pipe(
        catchError(error => {
          console.error('Error creating phase:', error);
          this.isCreatingPhase = false;
          this.showAlert('Erreur lors de la création de la phase.');
          return of(null);
        }),        // After successfully creating the phase, fetch all phases from the backend
        switchMap(createdPhase => {
          if (createdPhase) {
            // Reset the form
            this.newPhaseName = '';
            
            // Fetch all phases from the backend
            return this.phaseService.getPhasesByPropositionId(this.propositionId).pipe(
              catchError(error => {
                console.error('Error loading phases after creation:', error);
                return of([]);
              })
            );
          }
          return of(null);
        })
      )
      .subscribe(result => {
        this.isCreatingPhase = false;
        
        if (Array.isArray(result)) {
          // Create a map of existing phases with their livrables for lookup
          const existingPhaseMap = new Map<string, PhaseUI>();
          this.phases.forEach(phase => {
            if (phase.backendId) {
              existingPhaseMap.set(phase.backendId, phase);
            }
          });
          
          // Convert backend phases to UI phases, preserving existing livrables
          this.phases = result.map(bp => {
            // Check if this phase already exists in our UI
            const existingPhase = bp.id ? existingPhaseMap.get(bp.id) : undefined;
            
            return {
              id: bp.numero || 0, // Use backend numero as UI id
              name: bp.nom || 'Phase sans nom',
              livrables: existingPhase ? existingPhase.livrables : [], // Preserve existing livrables
              backendId: bp.id,
              numero: bp.numero
            };
          });
          
          // Update currentPhaseId to be the max ID used
          this.currentPhaseId = Math.max(...this.phases.map(p => p.id), 0);
          
          // Sort phases by numero
          this.phases.sort((a, b) => (a.numero || 0) - (b.numero || 0));
        }
      });
  }
  showAddLivrable(phaseId: number) {
    const phase = this.phases.find(p => p.id === phaseId);
    
    const dialogRef = this.dialog.open(AddLivrableDialogComponent, {
      data: {
        phaseId: phaseId,
        maxWeeks: this.totalProjectWeeks,
        phaseNumero: phase?.numero
      }
    });

    dialogRef.afterClosed().subscribe((result: LivrableDialogResult) => {
      if (result) {
        this.currentLivrable = {
          id: this.nextLivrableId,
          name: result.name,
          startWeek: result.startWeek,
          endWeek: result.endWeek,
          phaseId: result.phaseId,
          phaseNumero: result.phaseNumero
        };
        this.addLivrable();
      }
    });
  }

  addLivrable() {
    if (!this.currentLivrable) return;
    
    if (!this.currentLivrable.name.trim()) {
      this.showAlert("Le nom du livrable ne peut pas être vide.");
      return;
    }
    
    if (this.currentLivrable.startWeek <= 0 || this.currentLivrable.endWeek <= 0) {
      this.showAlert("Les semaines de début et de fin doivent être supérieures à zéro.");
      return;
    }

    if (this.currentLivrable.startWeek > this.totalProjectWeeks || this.currentLivrable.endWeek > this.totalProjectWeeks) {
      this.showAlert(`Les semaines de début et de fin ne peuvent pas dépasser la durée totale du projet (${this.totalProjectWeeks} semaines).`);
      return;
    }

    if (this.currentLivrable.startWeek > this.currentLivrable.endWeek) {
      this.showAlert("La semaine de début ne peut pas être postérieure à la semaine de fin.");
      return;
    }

    const phase = this.phases.find(p => p.id === this.currentLivrable!.phaseId);
    if (!phase) {
      this.showAlert("Phase introuvable. Impossible d'ajouter le livrable.");
      return;
    }
    
    // Calculate the new numero (sequential within phase)
    const livrableNumero = phase.livrables.length + 1;
    this.currentLivrable.numero = livrableNumero;
    
    // Add the livrable to the UI
    phase.livrables.push({...this.currentLivrable});
    
    // Sort livrables by startWeek first, then by endWeek if startWeek is equal
    phase.livrables.sort((a, b) => {
      if (a.startWeek === b.startWeek) {
        return a.endWeek - b.endWeek;
      }
      return a.startWeek - b.startWeek;
    });
    
    // After sorting, update all livrable numeros to reflect their position
    phase.livrables.forEach((livrable, index) => {
      livrable.numero = index + 1;
    });
      // Backend operations are now deferred until "Terminé" button is clicked
    
    this.nextLivrableId++;
    this.currentLivrable = null;
  }

  deleteLivrable(phaseId: number, livrableId: number) {
    const phase = this.phases.find(p => p.id === phaseId);
    if (!phase) return;

    // Find the livrable to delete
    const livrableToDelete = phase.livrables.find(l => l.id === livrableId);
    if (!livrableToDelete) return;

    // Check if the livrable has a backend ID
    if (livrableToDelete.backendId) {
      // Show confirmation dialog
      const dialogRef = this.dialog.open(ConfirmComponent, {
        data: {
          title: 'Confirmer la suppression',
          message: 'Êtes-vous sûr de vouloir supprimer ce livrable?',
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Call the backend API to delete the livrable
          this.livrableService.deleteLivrable(livrableToDelete.backendId!)
            .pipe(
              catchError(error => {
                console.error('Error deleting livrable:', error);
                this.showAlert('Erreur lors de la suppression du livrable.');
                return of(null);
              })
            )
            .subscribe(() => {
              // Remove the livrable from the UI
              phase.livrables = phase.livrables.filter(l => l.id !== livrableId);
              
              // Renumber remaining livrables
              phase.livrables.forEach((livrable, index) => {
                livrable.numero = index + 1;
              });
              
              this.showAlert('Livrable supprimé avec succès.');
            });
        }
      });
    } else {
      // Livrable only exists in the UI, just remove it without an API call
      phase.livrables = phase.livrables.filter(l => l.id !== livrableId);
      
      // Renumber remaining livrables
      phase.livrables.forEach((livrable, index) => {
        livrable.numero = index + 1;
      });
    }
  }

  deletePhase(phaseId: number) {
    const phaseToDelete = this.phases.find(p => p.id === phaseId);
    
    if (!phaseToDelete) return;
    
    // If phase has livrables, ask for confirmation
    if (phaseToDelete.livrables.length > 0) {
      const dialogRef = this.dialog.open(ConfirmComponent, {
        data: {
          title: 'Confirmer la suppression',
          message: 'Cette phase contient des livrables. Êtes-vous sûr de vouloir la supprimer?',
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.executePhaseDelete(phaseToDelete);
        }
      });
    } else {
      // No livrables, delete immediately
      this.executePhaseDelete(phaseToDelete);
    }
  }
  
  // Helper method to execute phase deletion
  private executePhaseDelete(phaseToDelete: PhaseUI): void {
    // If phase has a backend ID, delete it from backend first
    if (phaseToDelete.backendId) {
      this.isDeletingPhase = true;
      
      this.phaseService.deletePhase(phaseToDelete.backendId)
        .pipe(
          catchError(error => {
            console.error('Error deleting phase:', error);
            this.isDeletingPhase = false;
            this.showAlert('Erreur lors de la suppression de la phase.');
            return of(null);
          }),
          // After successfully deleting the phase, fetch all phases from the backend
          switchMap(() => {
            // Fetch all phases from the backend
            return this.phaseService.getPhasesByPropositionId(this.propositionId).pipe(
              catchError(error => {
                console.error('Error loading phases after deletion:', error);
                return of([]);
              })
            );
          })
        )
        .subscribe(result => {
          this.isDeletingPhase = false;
          
          if (Array.isArray(result)) {
            // Create a map of existing phases with their livrables for lookup
            const existingPhaseMap = new Map<string, PhaseUI>();
            this.phases.forEach(phase => {
              if (phase.backendId) {
                existingPhaseMap.set(phase.backendId, phase);
              }
            });
            
            // Convert backend phases to UI phases, preserving existing livrables
            this.phases = result.map(bp => {
              // Check if this phase already exists in our UI
              const existingPhase = bp.id ? existingPhaseMap.get(bp.id) : undefined;
              
              return {
                id: bp.numero || 0, // Use backend numero as UI id
                name: bp.nom || 'Phase sans nom',
                livrables: existingPhase ? existingPhase.livrables : [], // Preserve existing livrables
                backendId: bp.id,
                numero: bp.numero
              };
            });
            
            // Update currentPhaseId to be the max ID used
            this.currentPhaseId = Math.max(...this.phases.map(p => p.id), 0);
            
            // Sort phases by numero
            this.phases.sort((a, b) => (a.numero || 0) - (b.numero || 0));
          } else {
            // If fetching phases failed, just remove from UI array
            this.phases = this.phases.filter(p => p.id !== phaseToDelete.id);
          }
        });
    } else {
      // Phase only exists in UI, just remove it
      this.phases = this.phases.filter(p => p.id !== phaseToDelete.id);
    }
  }

  // Calculate the duration (in weeks) for a livrable based on its start and end weeks
  calculateLivrableDuration(livrable: LivrableItem): number {
    if (livrable.startWeek == null || livrable.endWeek == null) {
      return 0;
    }
    return livrable.endWeek - livrable.startWeek + 1;
  }

  onDurationsSubmit() {
    if (this.phases.length === 0) {
      this.showAlert("Aucune phase n'a été ajoutée. Veuillez ajouter au moins une phase avec des livrables.");
      return;
    }
    
    let hasEmptyPhases = false;
    for (const phase of this.phases) {
      if (phase.livrables.length === 0) {
        hasEmptyPhases = true;
        break;
      }
    }
    
    if (hasEmptyPhases) {
      this.showAlert("Certaines phases n'ont pas de livrables. Veuillez ajouter au moins un livrable à chaque phase.");
      return;
    }

    // Save all changes to the backend in a batch
    if (this.propositionId) {
      this.saveLivrablesInBatch();
    }

    // Complete the configuration and emit the configured livrables
    // We need to sort the livrables by phase first, then by start/end dates
    const outputLivrables: LivrableOutput[] = [];
    
    // Sort phases by numero first
    const sortedPhases = [...this.phases].sort((a, b) => (a.numero || 0) - (b.numero || 0));
    
    sortedPhases.forEach(phase => {
      // For each phase, sort livrables by start and end dates
      const sortedLivrables = [...phase.livrables].sort((a, b) => {
        if (a.startWeek === b.startWeek) {
          return a.endWeek - b.endWeek;
        }
        return a.startWeek - b.startWeek;
      });
      
      sortedLivrables.forEach(livrable => {
        outputLivrables.push({
          id: livrable.id,
          name: livrable.name,
          weeks: this.calculateLivrableDuration(livrable),
          startWeek: livrable.startWeek,
          endWeek: livrable.endWeek,
          phaseId: phase.id,
          phaseNumero: phase.numero,
          numero: livrable.numero,
          backendId: (livrable as any).backendId
        });
      });
    });

    console.log('[AddLivrableComponent] Emitting configured livrables:', outputLivrables);
    this.livrablesConfirmed.emit(outputLivrables);
    this.showConfiguration = false;
    this.configurationComplete = true;
  }

  selectInputContent(event: MouseEvent): void {
    const input = event.target as HTMLInputElement;
    input?.select();
  }
  
  // Method to get configured livrables for external use
  getConfiguredLivrables(): LivrableOutput[] {
    // We need to sort the livrables by phase first, then by start/end dates
    const outputLivrables: LivrableOutput[] = [];
    
    // Sort phases by numero first
    const sortedPhases = [...this.phases].sort((a, b) => (a.numero || 0) - (b.numero || 0));
    
    sortedPhases.forEach(phase => {
      // For each phase, sort livrables by start and end dates
      const sortedLivrables = [...phase.livrables].sort((a, b) => {
        if (a.startWeek === b.startWeek) {
          return a.endWeek - b.endWeek;
        }
        return a.startWeek - b.startWeek;
      });
      
      sortedLivrables.forEach(livrable => {
        outputLivrables.push({
          id: livrable.id,
          name: livrable.name,
          weeks: this.calculateLivrableDuration(livrable),
          startWeek: livrable.startWeek,
          endWeek: livrable.endWeek,
          phaseId: phase.id,
          phaseNumero: phase.numero,
          numero: livrable.numero,
          backendId: (livrable as any).backendId
        });
      });
    });
    
    return outputLivrables;
  }
  
  /**
   * Updates the nbrSemaines attribute of the proposition financiere
   * @param weeks The new number of weeks for the project
   */
  private updatePropositionSemaines(weeks: number): void {
    // Check if we have a valid proposition ID
    if (!this.propositionId) {
      console.warn('No proposition ID provided, cannot update nbrSemaines');
      return;
    }
    
    this.isUpdatingProposition = true;
    
    // First, get the current proposition
    this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId)
      .pipe(
        catchError(error => {
          this.isUpdatingProposition = false;
          console.error('Error fetching proposition financiere:', error);
          this.showAlert('Erreur lors de la récupération de la proposition financière.');
          return of(null);
        })
      )
      .subscribe(proposition => {
        if (!proposition) return;
        
        // Update the nbrSemaines attribute
        proposition.nbrSemaines = weeks;
        
        // Send the update to the backend
        this.propositionFinanciereService.updatePropositionFinanciere(this.propositionId, proposition)
          .pipe(
            catchError(error => {
              this.isUpdatingProposition = false;
              console.error('Error updating proposition financiere:', error);
              this.showAlert('Erreur lors de la mise à jour du nombre de semaines dans la proposition financière.');
              return of(null);
            })
          )
          .subscribe(updatedProposition => {
            this.isUpdatingProposition = false;
            if (updatedProposition) {
              console.log('Successfully updated proposition financiere with nbrSemaines:', weeks);
            }
          });
      });
  }

  /**
   * Save all livrables to the backend in a batch operation
   * Instead of making individual requests for each livrable, we'll collect
   * all changes and save them when the user clicks "Terminé"
   */
  private saveLivrablesInBatch(): void {
    if (!this.propositionId) {
      console.warn('No proposition ID provided, cannot save livrables');
      return;
    }

    // First, we need to determine what livrables to create, update, or delete
    let createPromises: any[] = [];
    let updatePromises: any[] = [];

    // For each phase, check its livrables
    this.phases.forEach(phase => {
      if (!phase.backendId) return; // Skip phases without backend IDs

      // Create/Update livrables for this phase
      phase.livrables.forEach(livrable => {
        // Prepare livrable data for backend
        const backendLivrable: Omit<LivrableDto, 'id'> = {
          nom: livrable.name,
          startWeek: livrable.startWeek,
          endWeek: livrable.endWeek,
          duration: this.calculateLivrableDuration(livrable),
          idPhase: phase.backendId,
          numero: livrable.numero // Use the sequential numero within the phase
        };

        // If this livrable already exists in the backend (has a backendId), update it
        if ((livrable as any).backendId) {
          const livrableId = (livrable as any).backendId;
          
          // Create a complete LivrableDto for update
          const fullBackendLivrable: LivrableDto = {
            id: livrableId,
            ...backendLivrable
          };
          
          // Queue this livrable for update
          updatePromises.push(
            this.livrableService.updateLivrable(livrableId, fullBackendLivrable)
              .pipe(
                catchError(error => {
                  console.error(`Error updating livrable ${livrableId}:`, error);
                  return of(null);
                })
              )
          );
        } else {
          // This is a new livrable, queue it for creation
          createPromises.push(
            this.livrableService.createLivrable(backendLivrable)
              .pipe(
                catchError(error => {
                  console.error('Error creating livrable:', error);
                  return of(null);
                })
              )
          );
        }
      });
    });

    // Execute all promises
    const allPromises = [...createPromises, ...updatePromises]; // Fixed array structure
    if (allPromises.length > 0) {
      console.log(`Processing ${createPromises.length} create operations and ${updatePromises.length} update operations`);
      
      // Use forkJoin to execute all promises in parallel
      forkJoin(allPromises).subscribe(results => {
        const successCount = results.filter(result => result !== null).length;
        console.log(`Successfully processed ${successCount} out of ${results.length} livrables`);
          // If there were any failures, log to console
        if (successCount < results.length) {
          console.error(`Failed to save ${results.length - successCount} livrables`);
        }
        if (successCount > 0) {
          this.showAlert('Livrables sauvegardés avec succès.');
        }
      });
    }
  }

  /**
   * Format the duration in months for display, removing unnecessary decimal places
   */
  getFormattedDurationMonths(): string {
    if (this.durationMonths % 1 === 0) {
      return this.durationMonths.toString(); // Show as integer if whole number
    }
    return this.durationMonths.toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
  }

  /**
   * Format the total project weeks for display
   */
  getFormattedProjectWeeks(): string {
    return this.totalProjectWeeks.toString();
  }
}
