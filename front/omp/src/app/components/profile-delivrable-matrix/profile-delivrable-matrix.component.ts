import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { firstValueFrom } from 'rxjs';
import { ProfilDto } from '../../models/profil.interface';
import { FinancialNavigationComponent } from '../financial-navigation/financial-navigation.component';

interface Profile {
  id: number;
  name: string;
  nomPrenom?: string;
  poste?: string;
  tjm?: number;
  entite?: string;
  userId?: string;
  dbId?: string; // Database ID for backend operations
}

interface Livrable {
  id: number;
  name: string;
  weeks: number;  // Changed from days to weeks
  phaseId?: number;
}

interface MatrixCell {
  profileId: number;
  livrableId: number;
  hommeJour: number;
}

@Component({
  selector: 'app-profile-delivrable-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule, FinancialNavigationComponent],
  templateUrl: './profile-delivrable-matrix.component.html',
  styleUrl: './profile-delivrable-matrix.component.css'
})
export class ProfileDelivrableMatrixComponent implements OnInit {
  profiles: Profile[] = [];
  livrables: Livrable[] = [];
  matrix: MatrixCell[][] = [];
  propositionId: string | null = null;
  opportunityId: string | null = null;
  isSubmitting: boolean = false;
  submitSuccess: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private propositionFinanciereService: PropositionFinanciereService
  ) {
    // Access state from history instead of navigation
    const state = history.state;
    
    if (state && state.profiles && state.livrables) {
      console.log('[ProfileDelivrableMatrix] Received state:', state);
      
      // Sort profiles by their numero property
      const sortedProfiles = [...state.profiles].sort((a, b) => {
        // Get the related profile DTOs if they exist via dbId
        const aNumero = a.numero !== undefined ? a.numero : 
                      (a.dbId && state.profileDtos ? 
                       state.profileDtos.find((p: ProfilDto) => p.id === a.dbId)?.numero : null);
        const bNumero = b.numero !== undefined ? b.numero : 
                      (b.dbId && state.profileDtos ? 
                       state.profileDtos.find((p: ProfilDto) => p.id === b.dbId)?.numero : null);
        
        // Handle null or undefined numero values by placing them at the end
        if (aNumero === undefined || aNumero === null) return 1;
        if (bNumero === undefined || bNumero === null) return -1;
        return aNumero - bNumero;
      });
      
      this.profiles = sortedProfiles;
      this.livrables = state.livrables;
      
      // Capture the proposition financiere ID from the navigation state
      if (state.propositionId) {
        this.propositionId = state.propositionId;
        console.log('[ProfileDelivrableMatrix] Received proposition ID from state:', this.propositionId);
        // Store in localStorage for persistence
        if (this.propositionId) {
          localStorage.setItem('current_proposition_id', this.propositionId);
        }
      } else {
        // Try to recover from localStorage as last resort
        const storedId = localStorage.getItem('current_proposition_id');
        if (storedId) {
          this.propositionId = storedId;
          console.log('[ProfileDelivrableMatrix] Recovered propositionId from localStorage:', this.propositionId);
        }
      }
      
      // Also capture opportunity ID if available
      if (state.opportunityId) {
        this.opportunityId = state.opportunityId;
      }
    } else {
      // Try to recover from localStorage before redirecting
      const storedId = localStorage.getItem('current_proposition_id');
      if (storedId) {
        this.propositionId = storedId;
        console.log('[ProfileDelivrableMatrix] No state found but recovered propositionId from localStorage:', this.propositionId);
        // We can't recover profiles and livrables from localStorage, so we'll need to redirect
        this.router.navigate(['/layout/offre-financiere'], {
          queryParams: { propositionId: this.propositionId }
        });
      } else {
        this.router.navigate(['/layout/nouveau-proposition']);
      }
    }
  }

  ngOnInit() {
    if (this.profiles.length > 0 && this.livrables.length > 0) {
      console.log('[ProfileDelivrableMatrix] Initializing with profiles:', this.profiles);
      console.log('[ProfileDelivrableMatrix] Initializing with livrables:', this.livrables);
      if (this.propositionId) {
        this.loadSavedMatrixData();
      } else {
        this.initializeMatrix();
      }
    }
  }

  private async loadSavedMatrixData() {
    try {
      console.log('[ProfileDelivrableMatrix] Loading saved matrix data for proposition:', this.propositionId);
      
      // Fetch the proposition which should contain the matrix data
      const proposition = await firstValueFrom(
        this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId!)
      );
      
      if (proposition && proposition.matricePL && proposition.matricePL.length > 0) {
        console.log('[ProfileDelivrableMatrix] Found saved matrix data:', proposition.matricePL);
        
        // Initialize the matrix structure first
        this.initializeMatrix();
        
        // Populate with saved values
        // Make sure the dimensions match
        const savedRows = Math.min(proposition.matricePL.length, this.profiles.length);
        for (let i = 0; i < savedRows; i++) {
          const savedCols = Math.min(proposition.matricePL[i].length, this.livrables.length);
          for (let j = 0; j < savedCols; j++) {
            this.matrix[i][j].hommeJour = proposition.matricePL[i][j];
          }
        }
        console.log('[ProfileDelivrableMatrix] Matrix populated with saved data:', this.matrix);
      } else {
        console.log('[ProfileDelivrableMatrix] No saved matrix data found, initializing empty matrix');
        this.initializeMatrix();
      }
    } catch (error) {
      console.error('[ProfileDelivrableMatrix] Error loading saved matrix data:', error);
      this.errorMessage = "Une erreur s'est produite lors du chargement des données de la matrice.";
      this.initializeMatrix(); // Fall back to empty matrix
    }
  }

  private initializeMatrix() {
    this.matrix = this.profiles.map(profile => 
      this.livrables.map(livrable => ({
        profileId: profile.id,
        livrableId: livrable.id,
        hommeJour: 0
      }))
    );
    console.log('[ProfileDelivrableMatrix] Initialized matrix:', this.matrix);
  }

  updateCell(profileIndex: number, livrableIndex: number, value: number) {
    if (this.matrix[profileIndex] && this.matrix[profileIndex][livrableIndex]) {
      const livrable = this.livrables[livrableIndex];
      if (value > livrable.weeks * 5) {  // Convert weeks to days for validation
        // If value exceeds the livrable's days, set it to the maximum allowed
        this.matrix[profileIndex][livrableIndex].hommeJour = livrable.weeks * 5;
        console.warn(`Value limited to ${livrable.weeks * 5} days for livrable ${livrable.name}`);
      } else {
        this.matrix[profileIndex][livrableIndex].hommeJour = value;
      }
    }
  }

  onKeyDown(event: KeyboardEvent, rowIndex: number, colIndex: number) {
    // Prevent default arrow key behavior for number inputs
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      
      let nextRow = rowIndex;
      let nextCol = colIndex;

      switch(event.key) {
        case 'ArrowUp':
          nextRow = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          nextRow = Math.min(this.profiles.length - 1, rowIndex + 1);
          break;
        case 'ArrowLeft':
          nextCol = Math.max(0, colIndex - 1);
          break;
        case 'ArrowRight':
          nextCol = Math.min(this.livrables.length - 1, colIndex + 1);
          break;
      }

      // Find the next input element and focus it
      const nextInput = document.querySelector(
        `input[data-row="${nextRow}"][data-col="${nextCol}"]`
      ) as HTMLInputElement;
      
      if (nextInput) {
        nextInput.focus();
        // Select the entire content of the input
        nextInput.select();
      }
    }
  }

  onCellClick(event: MouseEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  goBackToConfiguration() {
    // Navigate back to the configuration page
    // If we have a proposition ID, include it as a query parameter
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

      // Convert our 2D matrix to the format expected by the backend
      // The backend expects a List<List<int>> structure
      const matricePL = this.matrix.map(row => row.map(cell => cell.hommeJour));
      
      console.log('[ProfileDelivrableMatrix] Submitting matrix for proposition:', this.propositionId);
      console.log('[ProfileDelivrableMatrix] Matrix data:', matricePL);
      
      // Extract profile IDs
      const profilIds = this.profiles.map(p => p.dbId || '').filter(id => id !== '');

      // First, fetch the current proposition
      const proposition = await firstValueFrom(
        this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId)
      );

      // Update just the matricePL property
      proposition.matricePL = matricePL;
      
      // Update the proposition financière with the matrix data
      await firstValueFrom(
        this.propositionFinanciereService.updatePropositionFinanciere(this.propositionId, proposition)
      );
      
      this.submitSuccess = true;
      console.log('[ProfileDelivrableMatrix] Matrix submitted successfully');
      
      // Show success message briefly before navigating
      setTimeout(() => {
        // Navigate to offre-financiere with matrixSubmitted parameter to show display-feuil-one component
        this.router.navigate(['/layout/offre-financiere'], {
          queryParams: { 
            propositionId: this.propositionId,
            matrixSubmitted: 'true'
          }
        });
      }, 1500);
    } catch (error) {
      console.error('[ProfileDelivrableMatrix] Error submitting matrix:', error);
      this.errorMessage = "Une erreur s'est produite lors de la soumission de la matrice.";
    } finally {
      this.isSubmitting = false;
    }
  }
}
