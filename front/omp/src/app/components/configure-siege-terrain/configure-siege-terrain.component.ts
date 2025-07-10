import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { firstValueFrom } from 'rxjs';
import { ProfilDto } from '../../models/profil.interface';
import { LivrableDto } from '../../models/livrable.interface';
import { Phase } from '../../models/phase.interface';
import { ProfilService } from '../../services/profil.service';
import { LivrableService } from '../../services/livrable.service';
import { PhaseService } from '../../services/phase.service';
import { OpportuniteService, OpportuniteDto } from '../../services/opportunite.service';
import { FinancialNavigationComponent } from '../financial-navigation/financial-navigation.component';

interface MatrixCell {
  profileId: string;
  livrableId: string;
  siegeJour: number;
  terrainJour: number;
}

@Component({
  selector: 'app-configure-siege-terrain',
  standalone: true,
  imports: [CommonModule, FormsModule, FinancialNavigationComponent],
  templateUrl: './configure-siege-terrain.component.html',
  styleUrl: './configure-siege-terrain.component.css'
})
export class ConfigureSiegeTerrainComponent implements OnInit {
  @Input() propositionId: string | null = null;
  profiles: ProfilDto[] = [];
  livrables: LivrableDto[] = [];
  phases: Phase[] = [];
  phaseMap: Map<string, Phase> = new Map<string, Phase>(); // Map pour accès rapide aux phases par ID
  matrix: MatrixCell[][] = [];
  matricePL: number[][] = []; // Store the matricePL data separately
  matricePLSiege: number[][] = []; // Store the matricePLSiege data
  matricePLTerrain: number[][] = []; // Store the matricePLTerrain data
  opportunityId: string | null = null;
  isSubmitting: boolean = false;
  submitSuccess: boolean = false;
  errorMessage: string | null = null;
  loading: boolean = true;
  configurationMode: 'siege' | 'terrain' = 'siege'; // Default configuration mode
  nbrJoursParMois: number = 22; // Default value for working days per month

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private propositionFinanciereService: PropositionFinanciereService,
    private profilService: ProfilService,
    private livrableService: LivrableService,
    private phaseService: PhaseService,
    private opportuniteService: OpportuniteService
  ) {
    // First check for query parameters
    this.route.queryParams.subscribe(params => {
      if (params['propositionId']) {
        this.propositionId = params['propositionId'];
        console.log('[ConfigureSiegeTerrain] Received proposition ID from query params:', this.propositionId);
      } else {
        // Fallback to state if no query params
        const state = history.state;
        if (state && state.propositionId) {
          this.propositionId = state.propositionId;
          console.log('[ConfigureSiegeTerrain] Received proposition ID from state:', this.propositionId);
          
          if (state.opportunityId) {
            this.opportunityId = state.opportunityId;
          }
        }
      }
    });
  }

  ngOnInit() {
    // Get propositionId from multiple sources with priority order
    this.route.queryParams.subscribe(params => {
      if (params['propositionId']) {
        this.propositionId = params['propositionId'];
        console.log('[ConfigureSiegeTerrain] Using proposition ID from query params:', this.propositionId);
        // Store in localStorage for persistence (with null check)
        if (this.propositionId) {
          localStorage.setItem('current_proposition_id', this.propositionId);
        }
        
        if (params['opportunityId']) {
          this.opportunityId = params['opportunityId'];
        }
        
        this.loadData();
      } else {
        // Fallback to navigation state
        const state = history.state;
        if (state && state.propositionId) {
          this.propositionId = state.propositionId;
          console.log('[ConfigureSiegeTerrain] Using proposition ID from state:', this.propositionId);
          // Store in localStorage for persistence (with null check)
          if (this.propositionId) {
            localStorage.setItem('current_proposition_id', this.propositionId);
          }
          
          if (state.opportunityId) {
            this.opportunityId = state.opportunityId;
          }
          
          this.loadData();
        } else {
          // Try to recover from localStorage as last resort
          const storedId = localStorage.getItem('current_proposition_id');
          if (storedId) {
            this.propositionId = storedId;
            console.log('[ConfigureSiegeTerrain] Recovered propositionId from localStorage:', this.propositionId);
            this.loadData();
          } else {
            this.errorMessage = "Aucune proposition financière associée.";
            this.loading = false;
          }
        }
      }
    });
  }

  private async loadData() {
    try {
      this.loading = true;
      
      // Fetch profiles for this proposition
      this.profiles = await firstValueFrom(
        this.profilService.getProfilsByPropositionFinanciere(this.propositionId!)
      );
      
      // Sort profiles by numero
      this.profiles.sort((a, b) => {
        const aNumero = a.numero !== undefined ? a.numero : Number.MAX_VALUE;
        const bNumero = b.numero !== undefined ? b.numero : Number.MAX_VALUE;
        return aNumero - bNumero;
      });
      
      // Charger les phases pour cette proposition
      try {
        this.phases = await firstValueFrom(
          this.phaseService.getPhasesByPropositionId(this.propositionId!)
        );
        
        // Créer une map pour un accès rapide aux phases par ID
        this.phaseMap.clear();
        this.phases.forEach(phase => {
          if (phase.id) {
            this.phaseMap.set(phase.id, phase);
          }
        });
        console.log('[ConfigureSiegeTerrain] Loaded phases:', this.phases);
      } catch (phaseError) {
        console.error('[ConfigureSiegeTerrain] Error loading phases:', phaseError);
        this.phases = []; // Initialiser un tableau vide en cas d'erreur
      }
      
      // Charger les livrables (qui utiliseront maintenant les phases)
      if (this.opportunityId) {
        await this.loadLivrables();
      } else {
        // We'll just use the current proposition ID to load livrables
        console.log('[ConfigureSiegeTerrain] Loading livrables directly by proposition ID');
        await this.loadLivrables();
      }
      
      // Fetch proposition to get matrix data and matricePL data
      const proposition = await firstValueFrom(
        this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId!)
      );
      
      if (proposition) {
        // Store the matricePL data
        if (proposition.matricePL && proposition.matricePL.length > 0) {
          this.matricePL = proposition.matricePL;
          console.log('[ConfigureSiegeTerrain] Loaded matricePL data:', this.matricePL);
        }
        
        // Store the matricePLSiege data
        if (proposition.matricePLSiege && proposition.matricePLSiege.length > 0) {
          this.matricePLSiege = proposition.matricePLSiege;
          console.log('[ConfigureSiegeTerrain] Loaded matricePLSiege data:', this.matricePLSiege);
        }
        
        // Store the matricePLTerrain data
        if (proposition.matricePLTerrain && proposition.matricePLTerrain.length > 0) {
          this.matricePLTerrain = proposition.matricePLTerrain;
          console.log('[ConfigureSiegeTerrain] Loaded matricePLTerrain data:', this.matricePLTerrain);
        }
        
        // Load nbrJoursParMois value if it exists
        if (proposition.nbrJoursParMois !== undefined) {
          this.nbrJoursParMois = proposition.nbrJoursParMois;
          console.log('[ConfigureSiegeTerrain] Loaded nbrJoursParMois:', this.nbrJoursParMois);
        }
        
        // Initialize the matrix with the appropriate data based on the current mode
        this.initializeMatrix();
        this.loadCurrentModeMatrix();
      }
    } catch (error) {
      console.error('[ConfigureSiegeTerrain] Error loading data:', error);
      this.errorMessage = "Une erreur s'est produite lors du chargement des données.";
      this.initializeMatrix();
    } finally {
      this.loading = false;
    }
  }

  private async loadLivrables() {
    try {
      // Get livrables for this proposition
      this.livrables = await firstValueFrom(
        this.livrableService.getLivrablesByPropositionFinanciereId(this.propositionId!)
      );
      
      // Tri amélioré des livrables:
      // 1. D'abord par numéro de phase
      // 2. Ensuite par numero du livrable au sein de la phase
      this.livrables.sort((a, b) => {
        // Si les livrables sont dans des phases différentes, trier d'abord par phase
        if (a.idPhase !== b.idPhase) {
          // Récupérer les numéros de phase pour les comparer
          const getPhaseNumero = (livrable: LivrableDto) => {
            if (!livrable.idPhase) return Number.MAX_VALUE;
            const phase = this.phaseMap.get(livrable.idPhase);
            return phase && phase.numero !== undefined ? phase.numero : Number.MAX_VALUE;
          };
          
          return getPhaseNumero(a) - getPhaseNumero(b);
        }
        
        // Si les livrables sont dans la même phase, trier par numero
        const aNumero = a.numero !== undefined ? a.numero : Number.MAX_VALUE;
        const bNumero = b.numero !== undefined ? b.numero : Number.MAX_VALUE;
        return aNumero - bNumero;
      });
      
      console.log('[ConfigureSiegeTerrain] Loaded profiles:', this.profiles);
      console.log('[ConfigureSiegeTerrain] Loaded livrables sorted by phase and numero:', this.livrables);
    } catch (error) {
      console.error('[ConfigureSiegeTerrain] Error loading livrables:', error);
      this.errorMessage = "Une erreur s'est produite lors du chargement des livrables.";
    }
  }

  // Get the matricePL value for a specific profile and livrable
  getMatricePLValue(profileIndex: number, livrableIndex: number): number {
    // Check if matricePL data exists and has the required indexes
    if (
      this.matricePL && 
      this.matricePL.length > profileIndex && 
      this.matricePL[profileIndex] && 
      this.matricePL[profileIndex].length > livrableIndex
    ) {
      return this.matricePL[profileIndex][livrableIndex];
    }
    return 0; // Default value if no data is available
  }

  private initializeMatrix() {
    this.matrix = [];
    
    // Only initialize if we have both profiles and livrables
    if (this.profiles.length > 0 && this.livrables.length > 0) {
      this.matrix = this.profiles.map(profile => 
        this.livrables.map(livrable => ({
          profileId: profile.id,
          livrableId: livrable.id,
          siegeJour: 0,
          terrainJour: 0
        }))
      );
    }
    
    console.log('[ConfigureSiegeTerrain] Initialized matrix:', this.matrix);
  }

  // Load the matrix data based on the current configuration mode
  private loadCurrentModeMatrix() {
    if (this.configurationMode === 'siege') {
      this.loadSiegeMatrixData();
    } else {
      this.loadTerrainMatrixData();
    }
  }

  private loadSiegeMatrixData() {
    try {
      console.log('[ConfigureSiegeTerrain] Loading siege matrix data');
      
      if (!Array.isArray(this.matricePLSiege) || this.matricePLSiege.length === 0) {
        console.log('[ConfigureSiegeTerrain] No saved siege matrix data, using default values');
        return;
      }
      
      const rows = Math.min(this.matricePLSiege.length, this.profiles.length);
      for (let i = 0; i < rows; i++) {
        if (Array.isArray(this.matricePLSiege[i])) {
          const cols = Math.min(this.matricePLSiege[i].length, this.livrables.length);
          for (let j = 0; j < cols; j++) {
            if (this.matrix[i] && this.matrix[i][j]) {
              this.matrix[i][j].siegeJour = this.matricePLSiege[i][j] || 0;
            }
          }
        }
      }
      
      console.log('[ConfigureSiegeTerrain] Matrix populated with siege data:', this.matrix);
    } catch (error) {
      console.error('[ConfigureSiegeTerrain] Error loading siege matrix data:', error);
    }
  }

  private loadTerrainMatrixData() {
    try {
      console.log('[ConfigureSiegeTerrain] Loading terrain matrix data');
      
      if (!Array.isArray(this.matricePLTerrain) || this.matricePLTerrain.length === 0) {
        console.log('[ConfigureSiegeTerrain] No saved terrain matrix data, using default values');
        return;
      }
      
      const rows = Math.min(this.matricePLTerrain.length, this.profiles.length);
      for (let i = 0; i < rows; i++) {
        if (Array.isArray(this.matricePLTerrain[i])) {
          const cols = Math.min(this.matricePLTerrain[i].length, this.livrables.length);
          for (let j = 0; j < cols; j++) {
            if (this.matrix[i] && this.matrix[i][j]) {
              this.matrix[i][j].terrainJour = this.matricePLTerrain[i][j] || 0;
            }
          }
        }
      }
      
      console.log('[ConfigureSiegeTerrain] Matrix populated with terrain data:', this.matrix);
    } catch (error) {
      console.error('[ConfigureSiegeTerrain] Error loading terrain matrix data:', error);
    }
  }

  updateSiegeCell(profileIndex: number, livrableIndex: number, value: number) {
    if (this.matrix[profileIndex] && this.matrix[profileIndex][livrableIndex]) {
      const livrable = this.livrables[livrableIndex];
      const maxDays = livrable.duration! * 5; // Convert weeks to days
      const terrainValue = this.matrix[profileIndex][livrableIndex].terrainJour;
      
      // Get the matricePL value for this cell to enforce the new rule
      const matricePLValue = this.getMatricePLValue(profileIndex, livrableIndex);
      
      // New rule: set to 0 if siegeJour exceeds matricePL value
      if (value > matricePLValue) {
        this.matrix[profileIndex][livrableIndex].siegeJour = 0;
        // Highlight the cell as invalid
        this.flashCellAsInvalid(profileIndex, livrableIndex, 'siege');
      }
      // Original rule: total siege+terrain cannot exceed livrable's max days
      else if (value + terrainValue > maxDays) {
        this.matrix[profileIndex][livrableIndex].siegeJour = maxDays - terrainValue;
      } else {
        this.matrix[profileIndex][livrableIndex].siegeJour = value;
      }
    }
  }

  updateTerrainCell(profileIndex: number, livrableIndex: number, value: number) {
    if (this.matrix[profileIndex] && this.matrix[profileIndex][livrableIndex]) {
      const livrable = this.livrables[livrableIndex];
      const maxDays = livrable.duration! * 5; // Convert weeks to days
      const siegeValue = this.matrix[profileIndex][livrableIndex].siegeJour;
      
      // Get the matricePL value for this cell to enforce the new rule
      const matricePLValue = this.getMatricePLValue(profileIndex, livrableIndex);
      
      // New rule: set to 0 if terrainJour exceeds matricePL value
      if (value > matricePLValue) {
        this.matrix[profileIndex][livrableIndex].terrainJour = 0;
        // Highlight the cell as invalid
        this.flashCellAsInvalid(profileIndex, livrableIndex, 'terrain');
      }
      // Original rule: total siege+terrain cannot exceed livrable's max days
      else if (value + siegeValue > maxDays) {
        this.matrix[profileIndex][livrableIndex].terrainJour = maxDays - siegeValue;
      } else {
        this.matrix[profileIndex][livrableIndex].terrainJour = value;
      }
    }
  }

  // New method to flash a cell as invalid temporarily
  flashCellAsInvalid(profileIndex: number, livrableIndex: number, fieldType: 'siege' | 'terrain') {
    // Find the input element by its data attributes
    setTimeout(() => {
      const cell = document.querySelector(
        `input[data-row="${profileIndex}"][data-col="${livrableIndex}"][data-field="${fieldType}"]`
      ) as HTMLInputElement;
      
      if (cell) {
        // Add the invalid class
        cell.classList.add('invalid-value');
        
        // Remove the class after 1 second
        setTimeout(() => {
          cell.classList.remove('invalid-value');
        }, 1000);
      }
    }, 0); // Using setTimeout to let the DOM update first
  }

  onKeyDown(event: KeyboardEvent, rowIndex: number, colIndex: number, fieldType: 'siege' | 'terrain') {
    // Prevent default arrow key behavior for number inputs
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      event.preventDefault();
      
      let nextRow = rowIndex;
      let nextCol = colIndex;
      let nextField = fieldType;

      switch(event.key) {
        case 'ArrowUp':
          nextRow = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          nextRow = Math.min(this.profiles.length - 1, rowIndex + 1);
          break;
        case 'ArrowLeft':
          if (fieldType === 'terrain') {
            nextField = 'siege';
          } else {
            nextCol = Math.max(0, colIndex - 1);
            nextField = 'terrain';
          }
          break;
        case 'ArrowRight':
        case 'Tab':
          if (fieldType === 'siege') {
            nextField = 'terrain';
          } else {
            nextCol = Math.min(this.livrables.length - 1, colIndex + 1);
            nextField = 'siege';
          }
          break;
      }

      // Find the next input element and focus it
      const nextInput = document.querySelector(
        `input[data-row="${nextRow}"][data-col="${nextCol}"][data-field="${nextField}"]`
      ) as HTMLInputElement;
      
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  }

  onCellClick(event: MouseEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  goBack() {
    // Navigate back
    if (this.propositionId) {
      this.router.navigate(['/layout/offre-financiere'], {
        queryParams: { propositionId: this.propositionId }
      });
    } else {
      this.router.navigate(['/layout/nouveau-proposition']);
    }
  }
  
  async submitMatrix() {
    if (!this.propositionId) {
      this.errorMessage = "Aucune proposition financière associée. Impossible de soumettre la matrice.";
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = null;
      this.submitSuccess = false;

      // First, fetch the current proposition
      const proposition = await firstValueFrom(
        this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId)
      );

      if (this.configurationMode === 'siege') {
        // Extract siege values from the matrix
        const matriceSiege: number[][] = this.matrix.map(row => 
          row.map(cell => cell.siegeJour)
        );
        
        console.log('[ConfigureSiegeTerrain] Submitting siege matrix:', matriceSiege);
        
        // Update the matricePLSiege property
        proposition.matricePLSiege = matriceSiege;
      } else {
        // Extract terrain values from the matrix
        const matriceTerrain: number[][] = this.matrix.map(row => 
          row.map(cell => cell.terrainJour)
        );
        
        console.log('[ConfigureSiegeTerrain] Submitting terrain matrix:', matriceTerrain);
        
        // Update the matricePLTerrain property
        proposition.matricePLTerrain = matriceTerrain;
      }
      
      // Update nbrJoursParMois value
      proposition.nbrJoursParMois = this.nbrJoursParMois;
      console.log('[ConfigureSiegeTerrain] Setting nbrJoursParMois to:', this.nbrJoursParMois);
      
      // Update the proposition financière with the matrix data and nbrJoursParMois
      await firstValueFrom(
        this.propositionFinanciereService.updatePropositionFinanciere(this.propositionId, proposition)
      );
      
      this.submitSuccess = true;
      console.log('[ConfigureSiegeTerrain] Matrix and nbrJoursParMois submitted successfully');
      
      // Show success message briefly before navigating
      setTimeout(() => {
        // Navigate to display-feuil-two instead of offre-financiere
        this.router.navigate(['/layout/display-feuil-two'], {
          queryParams: { 
            propositionId: this.propositionId
          }
        });
      }, 1500);
    } catch (error) {
      console.error('[ConfigureSiegeTerrain] Error submitting matrix:', error);
      this.errorMessage = "Une erreur s'est produite lors de la soumission de la matrice.";
    } finally {
      this.isSubmitting = false;
    }
  }
  
  calculateTotalSiegeTerrain(profileIndex: number): { siege: number, terrain: number } {
    let siegeTotal = 0;
    let terrainTotal = 0;
    
    for (let j = 0; j < this.livrables.length; j++) {
      siegeTotal += this.matrix[profileIndex][j].siegeJour;
      terrainTotal += this.matrix[profileIndex][j].terrainJour;
    }
    
    return { siege: siegeTotal, terrain: terrainTotal };
  }
  
  calculateTotalByLivrable(livrableIndex: number): { siege: number, terrain: number } {
    let siegeTotal = 0;
    let terrainTotal = 0;
    
    for (let i = 0; i < this.profiles.length; i++) {
      siegeTotal += this.matrix[i][livrableIndex].siegeJour;
      terrainTotal += this.matrix[i][livrableIndex].terrainJour;
    }
    
    return { siege: siegeTotal, terrain: terrainTotal };
  }

  // Method to change the configuration mode
  changeConfigMode(mode: 'siege' | 'terrain') {
    this.configurationMode = mode;
    console.log('[ConfigureSiegeTerrain] Configuration mode changed to:', mode);
    
    // Reset the matrix with zeros before loading the appropriate data
    this.initializeMatrix();
    
    // Load the matrix data for the selected mode
    this.loadCurrentModeMatrix();
  }
}
