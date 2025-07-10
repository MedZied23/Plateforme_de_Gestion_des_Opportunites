import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfilService } from '../../services/profil.service';
import { LivrableService } from '../../services/livrable.service';
import { PhaseService } from '../../services/phase.service';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { DocumentExportService } from '../../services/document-export.service';
import { ProfilDto } from '../../models/profil.interface';
import { LivrableDto } from '../../models/livrable.interface';
import { Phase } from '../../models/phase.interface';
import { firstValueFrom } from 'rxjs';
import { FinancialNavigationComponent } from '../financial-navigation/financial-navigation.component';

interface MatrixCell {
  profileId: string;
  livrableId: string;
  siegeJour: number;
  terrainJour: number;
}

@Component({
  selector: 'app-display-feuil-two',
  standalone: true,
  imports: [CommonModule, FinancialNavigationComponent],
  templateUrl: './display-feuil-two.component.html',
  styleUrl: './display-feuil-two.component.css'
})
export class DisplayFeuilTwoComponent implements OnInit {
  propositionId: string | null = null;
  profiles: ProfilDto[] = [];
  livrables: LivrableDto[] = [];
  phases: Phase[] = [];
  phaseMap: Map<string, Phase> = new Map<string, Phase>();
  matrix: MatrixCell[][] = [];
  loading: boolean = true;
  errorMessage: string | null = null;
  matricePLSiege: number[][] = [];
  matricePLTerrain: number[][] = [];
  matricePLSiegeParJour: number[][] = [];
  matricePLTerrainParJour: number[][] = [];
  isExportingPdf: boolean = false;
  propositionDetails: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profilService: ProfilService,
    private livrableService: LivrableService,
    private phaseService: PhaseService,
    private propositionFinanciereService: PropositionFinanciereService,
    private documentExportService: DocumentExportService
  ) {}

  ngOnInit(): void {
    // Get propositionId from multiple sources with priority order
    this.route.queryParams.subscribe(params => {
      if (params['propositionId']) {
        this.propositionId = params['propositionId'];
        console.log('[DisplayFeuilTwo] Using proposition ID from query params:', this.propositionId);
        // Store in localStorage for persistence (with null check)
        if (this.propositionId) {
          localStorage.setItem('current_proposition_id', this.propositionId);
        }
        
        this.loadData();
      } else {
        // Fallback to navigation state
        const state = history.state;
        if (state && state.propositionId) {
          this.propositionId = state.propositionId;
          console.log('[DisplayFeuilTwo] Using proposition ID from state:', this.propositionId);
          // Store in localStorage for persistence (with null check)
          if (this.propositionId) {
            localStorage.setItem('current_proposition_id', this.propositionId);
          }
          
          this.loadData();
        } else {
          // Try to recover from localStorage as last resort
          const storedId = localStorage.getItem('current_proposition_id');
          if (storedId) {
            this.propositionId = storedId;
            console.log('[DisplayFeuilTwo] Recovered propositionId from localStorage:', this.propositionId);
            this.loadData();
          } else {
            console.log('[DisplayFeuilTwo] No proposition ID provided');
            this.loading = false;
            this.errorMessage = "Aucune proposition financière associée.";
          }
        }
      }
    });
  }

  private async loadData() {
    try {
      this.loading = true;
      
      if (!this.propositionId) {
        throw new Error("Proposition ID is required");
      }
      
      // Fetch profiles for this proposition
      this.profiles = await firstValueFrom(
        this.profilService.getProfilsByPropositionFinanciere(this.propositionId)
      );
      
      // Sort profiles by numero
      this.profiles.sort((a, b) => {
        const aNumero = a.numero !== undefined ? a.numero : Number.MAX_VALUE;
        const bNumero = b.numero !== undefined ? b.numero : Number.MAX_VALUE;
        return aNumero - bNumero;
      });
      
      // Load phases for this proposition
      try {
        this.phases = await firstValueFrom(
          this.phaseService.getPhasesByPropositionId(this.propositionId)
        );
        
        // Create map for quick access to phases by ID
        this.phaseMap.clear();
        this.phases.forEach(phase => {
          if (phase.id) {
            this.phaseMap.set(phase.id, phase);
          }
        });
        console.log('[DisplayFeuilTwo] Loaded phases:', this.phases);
      } catch (phaseError) {
        console.error('[DisplayFeuilTwo] Error loading phases:', phaseError);
        this.phases = []; // Initialize empty array in case of error
      }
      
      // Load livrables for this proposition
      await this.loadLivrables();
      
      // Fetch proposition to get matrix data
      const proposition = await firstValueFrom(
        this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId)
      );
      
      if (proposition) {
        this.propositionDetails = proposition;

        // Store the matricePLSiege data
        if (proposition.matricePLSiege && proposition.matricePLSiege.length > 0) {
          this.matricePLSiege = proposition.matricePLSiege;
          console.log('[DisplayFeuilTwo] Loaded matricePLSiege data:', this.matricePLSiege);
        }
        
        // Store the matricePLTerrain data
        if (proposition.matricePLTerrain && proposition.matricePLTerrain.length > 0) {
          this.matricePLTerrain = proposition.matricePLTerrain;
          console.log('[DisplayFeuilTwo] Loaded matricePLTerrain data:', this.matricePLTerrain);
        }
        
        // Store the matricePLSiegeParJour data
        if (proposition.matricePLSiegeParJour && proposition.matricePLSiegeParJour.length > 0) {
          this.matricePLSiegeParJour = proposition.matricePLSiegeParJour;
          console.log('[DisplayFeuilTwo] Loaded matricePLSiegeParJour data:', this.matricePLSiegeParJour);
        }
        
        // Store the matricePLTerrainParJour data
        if (proposition.matricePLTerrainParJour && proposition.matricePLTerrainParJour.length > 0) {
          this.matricePLTerrainParJour = proposition.matricePLTerrainParJour;
          console.log('[DisplayFeuilTwo] Loaded matricePLTerrainParJour data:', this.matricePLTerrainParJour);
        }
        
        // Initialize the matrix
        this.initializeMatrix();
      }
    } catch (error) {
      console.error('[DisplayFeuilTwo] Error loading data:', error);
      this.errorMessage = "Une erreur s'est produite lors du chargement des données.";
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
      
      // Improved sorting of livrables:
      // 1. First by phase number
      // 2. Then by livrable number within phase
      this.livrables.sort((a, b) => {
        // If livrables are in different phases, sort by phase first
        if (a.idPhase !== b.idPhase) {
          // Get phase numbers for comparison
          const getPhaseNumero = (livrable: LivrableDto) => {
            if (!livrable.idPhase) return Number.MAX_VALUE;
            const phase = this.phaseMap.get(livrable.idPhase);
            return phase && phase.numero !== undefined ? phase.numero : Number.MAX_VALUE;
          };
          
          return getPhaseNumero(a) - getPhaseNumero(b);
        }
        
        // If livrables are in the same phase, sort by number
        const aNumero = a.numero !== undefined ? a.numero : Number.MAX_VALUE;
        const bNumero = b.numero !== undefined ? b.numero : Number.MAX_VALUE;
        return aNumero - bNumero;
      });
      
      console.log('[DisplayFeuilTwo] Loaded profiles:', this.profiles);
      console.log('[DisplayFeuilTwo] Loaded livrables sorted by phase and numero:', this.livrables);
    } catch (error) {
      console.error('[DisplayFeuilTwo] Error loading livrables:', error);
      this.errorMessage = "Une erreur s'est produite lors du chargement des livrables.";
    }
  }

  private initializeMatrix() {
    this.matrix = [];
    
    // Only initialize if we have both profiles and livrables
    if (this.profiles.length > 0 && this.livrables.length > 0) {
      this.matrix = this.profiles.map((profile, i) => 
        this.livrables.map((livrable, j) => ({
          profileId: profile.id,
          livrableId: livrable.id,
          siegeJour: this.getSiegeValue(i, j),
          terrainJour: this.getTerrainValue(i, j)
        }))
      );
    }
    
    console.log('[DisplayFeuilTwo] Initialized matrix:', this.matrix);
  }
  
  // Get siege value for a specific profile and livrable
  getSiegeValue(profileIndex: number, livrableIndex: number): number {
    if (
      this.matricePLSiege && 
      this.matricePLSiege.length > profileIndex && 
      this.matricePLSiege[profileIndex] && 
      this.matricePLSiege[profileIndex].length > livrableIndex
    ) {
      return this.matricePLSiege[profileIndex][livrableIndex] || 0;
    }
    return 0;
  }
  
  // Get terrain value for a specific profile and livrable
  getTerrainValue(profileIndex: number, livrableIndex: number): number {
    if (
      this.matricePLTerrain && 
      this.matricePLTerrain.length > profileIndex && 
      this.matricePLTerrain[profileIndex] && 
      this.matricePLTerrain[profileIndex].length > livrableIndex
    ) {
      return this.matricePLTerrain[profileIndex][livrableIndex] || 0;
    }
    return 0;
  }
  
  // Get siege par jour value for a specific profile and livrable
  getSiegeParJourValue(profileIndex: number, livrableIndex: number): number {
    if (
      this.matricePLSiegeParJour && 
      this.matricePLSiegeParJour.length > profileIndex && 
      this.matricePLSiegeParJour[profileIndex] && 
      this.matricePLSiegeParJour[profileIndex].length > livrableIndex
    ) {
      return this.matricePLSiegeParJour[profileIndex][livrableIndex] || 0;
    }
    return 0;
  }
  
  // Get terrain par jour value for a specific profile and livrable
  getTerrainParJourValue(profileIndex: number, livrableIndex: number): number {
    if (
      this.matricePLTerrainParJour && 
      this.matricePLTerrainParJour.length > profileIndex && 
      this.matricePLTerrainParJour[profileIndex] && 
      this.matricePLTerrainParJour[profileIndex].length > livrableIndex
    ) {
      return this.matricePLTerrainParJour[profileIndex][livrableIndex] || 0;
    }
    return 0;
  }
  
  // Calculate total siege and terrain days for a profile
  calculateTotalForProfile(profileIndex: number): { siege: number, terrain: number } {
    let siegeTotal = 0;
    let terrainTotal = 0;
    
    for (let j = 0; j < this.livrables.length; j++) {
      siegeTotal += this.matrix[profileIndex][j].siegeJour;
      terrainTotal += this.matrix[profileIndex][j].terrainJour;
    }
    
    return { siege: siegeTotal, terrain: terrainTotal };
  }
  
  // Calculate total siege and terrain days for a livrable
  calculateTotalForLivrable(livrableIndex: number): { siege: number, terrain: number } {
    let siegeTotal = 0;
    let terrainTotal = 0;
    
    for (let i = 0; i < this.profiles.length; i++) {
      siegeTotal += this.matrix[i][livrableIndex].siegeJour;
      terrainTotal += this.matrix[i][livrableIndex].terrainJour;
    }
    
    return { siege: siegeTotal, terrain: terrainTotal };
  }
  
  // Get the phase name for a livrable
  getPhaseName(livrable: LivrableDto): string {
    if (livrable.idPhase) {
      const phase = this.phaseMap.get(livrable.idPhase);
      return phase ? phase.nom || '' : '';
    }
    return '';
  }

  // Get the total siege par jour for a profile
  getTotalSiegeParJour(profileIndex: number): number {
    if (profileIndex >= 0 && profileIndex < this.profiles.length && this.profiles[profileIndex].totalSiegeParJour) {
      return this.profiles[profileIndex].totalSiegeParJour;
    }
    return 0;
  }
  
  // Get the total terrain par jour for a profile
  getTotalTerrainParJour(profileIndex: number): number {
    if (profileIndex >= 0 && profileIndex < this.profiles.length && this.profiles[profileIndex].totalTerrainParJour) {
      return this.profiles[profileIndex].totalTerrainParJour;
    }
    return 0;
  }
  
  // Calculate total siege par jour for all profiles
  calculateTotalSiegeParJour(): number {
    return this.profiles.reduce((total, profile) => total + (profile.totalSiegeParJour || 0), 0);
  }
  
  // Calculate total terrain par jour for all profiles
  calculateTotalTerrainParJour(): number {
    return this.profiles.reduce((total, profile) => total + (profile.totalTerrainParJour || 0), 0);
  }

  // Calculate grand total (siege + terrain) for all profiles
  calculateGrandTotal(): number {
    return this.calculateTotalSiegeParJour() + this.calculateTotalTerrainParJour();
  }

  // Calculate total siege par jour for a specific livrable across all profiles
  calculateSiegeTotalForLivrable(livrableIndex: number): number {
    let total = 0;
    for (let i = 0; i < this.profiles.length; i++) {
      total += this.getSiegeParJourValue(i, livrableIndex);
    }
    return total;
  }

  // Calculate total terrain par jour for a specific livrable across all profiles
  calculateTerrainTotalForLivrable(livrableIndex: number): number {
    let total = 0;
    for (let i = 0; i < this.profiles.length; i++) {
      total += this.getTerrainParJourValue(i, livrableIndex);
    }
    return total;
  }

  goBack() {
    if (this.propositionId) {
      this.router.navigate(['/layout/offre-financiere'], {
        queryParams: { propositionId: this.propositionId }
      });
    } else {
      this.router.navigate(['/layout/offre-financiere']);
    }
  }

  /**
   * Export the current view as a PDF document
   */
  exportToPdf(): void {
    this.isExportingPdf = true;
    
    // Use setTimeout to allow UI to update and show loading state
    setTimeout(() => {
      try {
        // Generate filename using proposition title or default name
        const filename = this.propositionDetails?.titre 
          ? `Distribution_Siege_Terrain_${this.propositionDetails.titre.replace(/\s+/g, '_')}`
          : `Distribution_Siege_Terrain_${this.propositionId}`;
          
        // Define options with landscape orientation and table-friendly page breaks
        const options = {
          orientation: 'landscape' as 'landscape',
          format: 'a4',
          pagebreak: {
            mode: ['avoid-all'],
            avoid: ['.matrix-content', '.siege-terrain-table']
          }
        };
        
        this.documentExportService.exportToPdf('feuilTwoContent', filename, options);
      } catch (error) {
        console.error('[DisplayFeuilTwo] Error exporting PDF:', error);
      } finally {
        // Reset export state after a short delay
        setTimeout(() => {
          this.isExportingPdf = false;
        }, 1000);
      }
    }, 100);
  }
}
