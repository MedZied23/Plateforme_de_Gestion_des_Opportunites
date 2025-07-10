import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { ProfilService } from '../../services/profil.service';
import { PropositionFinanciereDto, TypeDepense } from '../../models/proposition-financiere.interface';
import { ProfilDto } from '../../models/profil.interface';
import { FinancialNavigationComponent } from '../financial-navigation/financial-navigation.component';

@Component({
  selector: 'app-setting-depenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FinancialNavigationComponent
  ],
  templateUrl: './setting-depenses.component.html',
  styleUrl: './setting-depenses.component.css'
})
export class SettingDepensesComponent implements OnInit {
  propositionId: string | null = null;
  proposition: PropositionFinanciereDto | null = null;
  typeDepenseEnum = TypeDepense;
  typeDepenseValues: { type: TypeDepense, name: string }[] = [];
  isLoading: boolean = false;
  isPricesEditing: boolean = false;
  isUnitsEditing: boolean = false;
  isSaving: boolean = false;
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' | null = null;
  
  // Store the expense prices
  expensePrices: Record<TypeDepense, number> = {
    [TypeDepense.AllocationPerDiem]: 0,
    [TypeDepense.VoyageInternationaux]: 0,
    [TypeDepense.FraisVisaTimbreVoyage]: 0,
    [TypeDepense.TransfertLocationsVoitures]: 0,
    [TypeDepense.Logement]: 0
  };

  // Store profiles with terrain activities
  profilesWithTerrain: ProfilDto[] = [];

  // Store expense units per profile
  profileExpenseUnits: Record<string, Record<TypeDepense, number>> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propositionFinanciereService: PropositionFinanciereService,
    private profilService: ProfilService
  ) {
    // Initialize the array of TypeDepense values for display
    this.typeDepenseValues = Object.keys(TypeDepense)
      .filter(key => isNaN(Number(key))) // Filter out numeric keys
      .map(key => ({
        type: TypeDepense[key as keyof typeof TypeDepense],
        name: key
      }));
  }

  ngOnInit(): void {
    // Get the proposition ID from the query parameters
    this.route.queryParams.subscribe(params => {
      this.propositionId = params['propositionId'] || null;
      
      if (!this.propositionId) {
        console.error('No proposition ID provided');
        this.showNotification('Aucune proposition financière spécifiée', 'error');
        this.navigateToPropositionList();
      } else {
        // Load depenses data for this proposition
        this.loadDepensesData();
      }
    });
  }

  loadDepensesData(): void {
    if (!this.propositionId) return;
    
    this.isLoading = true;

    // Load proposition data first
    this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId).subscribe({
      next: (proposition) => {
        this.proposition = proposition;
        console.log('Loaded proposition data:', proposition);
        
        // Initialize expense prices from proposition data
        if (proposition.prixDepenses) {
          // Reset expense prices first
          this.expensePrices = {
            [TypeDepense.AllocationPerDiem]: 0,
            [TypeDepense.VoyageInternationaux]: 0,
            [TypeDepense.FraisVisaTimbreVoyage]: 0,
            [TypeDepense.TransfertLocationsVoitures]: 0,
            [TypeDepense.Logement]: 0
          };
          
          Object.entries(proposition.prixDepenses).forEach(([key, value]) => {
            const typeKey = isNaN(Number(key)) ? 
              TypeDepense[key as keyof typeof TypeDepense] : 
              Number(key) as TypeDepense;
            
            if (typeKey !== undefined && value !== undefined) {
              this.expensePrices[typeKey] = Number(value);
            }
          });
        }

        // Now load profiles
        this.loadProfiles();
      },
      error: (error) => {
        console.error('Error loading proposition data:', error);
        this.isLoading = false;
        this.showNotification('Erreur lors du chargement des données', 'error');
      }
    });
  }
  private loadProfiles(): void {
    if (!this.propositionId) return;

    this.profilService.getProfilsByPropositionFinanciere(this.propositionId).subscribe({
      next: (profiles) => {
        // Reset profiles and expense units
        this.profilesWithTerrain = [];
        this.profileExpenseUnits = {};

        // Check if any profile has totalDepense > 0
        const hasProfilesWithExpenses = profiles.some(p => p.totalDepense && p.totalDepense > 0);
        
        if (hasProfilesWithExpenses) {
          // If there are profiles with expenses, only show those
          this.profilesWithTerrain = profiles.filter(p => p.totalDepense && p.totalDepense > 0);
          console.log('Loading profiles with existing expenses:', this.profilesWithTerrain);
        } else {
          // If no profiles have expenses yet, show all profiles with terrain > 0
          this.profilesWithTerrain = profiles.filter(p => p.totalTerrain && p.totalTerrain > 0);
          console.log('Loading profiles with terrain > 0:', this.profilesWithTerrain);
        }
        
        // Initialize or update profile expense units
        this.profilesWithTerrain.forEach(profile => {
          // Initialize default values for the profile
          this.profileExpenseUnits[profile.id] = {
            [TypeDepense.AllocationPerDiem]: 0,
            [TypeDepense.VoyageInternationaux]: 0,
            [TypeDepense.FraisVisaTimbreVoyage]: 0,
            [TypeDepense.TransfertLocationsVoitures]: 0,
            [TypeDepense.Logement]: 0
          };
          
          // Load existing units if available
          if (profile.unitsDepense) {
            Object.entries(profile.unitsDepense).forEach(([key, value]) => {
              const typeKey = isNaN(Number(key)) ? 
                TypeDepense[key as keyof typeof TypeDepense] : 
                Number(key) as TypeDepense;
              
              if (typeKey !== undefined && value !== undefined) {
                this.profileExpenseUnits[profile.id][typeKey] = Number(value);
              }
            });
          }
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.isLoading = false;
        this.showNotification('Erreur lors du chargement des profils', 'error');
      }
    });
  }

  // Calculate total expense for a profile
  calculateProfileExpenseTotal(profileId: string): number {
    let total = 0;
    const units = this.profileExpenseUnits[profileId];
    
    if (units) {
      Object.entries(units).forEach(([typeKey, unitCount]) => {
        if (unitCount) {
          const typeDepense = Number(typeKey) as TypeDepense;
          const price = this.expensePrices[typeDepense] || 0;
          total += price * unitCount;
        }
      });
    }
    
    return total;
  }

  // Get formatted total for a profile
  getProfileExpenseTotal(profileId: string): number {
    return this.calculateProfileExpenseTotal(profileId);
  }

  // Toggle prices edit mode
  togglePricesEditMode(): void {
    this.isPricesEditing = !this.isPricesEditing;
  }

  // Toggle units edit mode
  toggleUnitsEditMode(): void {
    this.isUnitsEditing = !this.isUnitsEditing;
  }

  // Save both expense prices and profile units
  saveExpenses(): void {
    if (!this.propositionId || !this.proposition) {
      this.showNotification('Données de proposition non disponibles', 'error');
      return;
    }

    this.isSaving = true;
    
    // Update the prixDepenses in the proposition object
    this.proposition.prixDepenses = { ...this.expensePrices };
    
    // Calculate total expenses
    let totalExpenses = 0;
    this.profilesWithTerrain.forEach(profile => {
      const profileTotal = this.calculateProfileExpenseTotal(profile.id);
      totalExpenses += profileTotal;
    });
    this.proposition.totalExpenses = totalExpenses;

    // First save the proposition with the updated prices
    this.propositionFinanciereService.updatePropositionFinanciere(this.propositionId, this.proposition)
      .subscribe({
        next: (updatedProposition) => {
          this.proposition = updatedProposition;
          
          // Now update each profile with their expense units
          const profileUpdates = this.profilesWithTerrain.map(profile => {
            const totalForProfile = this.calculateProfileExpenseTotal(profile.id);
            const updatedProfile: ProfilDto = {
              ...profile,
              unitsDepense: this.profileExpenseUnits[profile.id],
              totalDepense: totalForProfile
            };
            return this.profilService.updateProfil(profile.id, updatedProfile).toPromise();
          });

          // Wait for all profile updates to complete
          Promise.all(profileUpdates)
            .then(() => {
              // Reload the data to ensure everything is in sync
              this.loadDepensesData();
              this.isSaving = false;
              this.isPricesEditing = false;
              this.isUnitsEditing = false;
              this.showNotification('Dépenses enregistrées avec succès', 'success');
            })
            .catch((error) => {
              console.error('Error updating profile expenses:', error);
              this.isSaving = false;
              this.showNotification('Erreur lors de l\'enregistrement des dépenses des profils', 'error');
            });
        },
        error: (error) => {
          console.error('Error saving expenses:', error);
          this.isSaving = false;
          this.showNotification('Erreur lors de l\'enregistrement des dépenses', 'error');
        }
      });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/layout/display-propositions-financieres']);
  }

  navigateToPropositionList(): void {
    this.router.navigate(['/layout/propositions-financieres']);
  }

  navigateToAllPropositions(): void {
    this.router.navigate(['/layout/display-propositions-financieres']);
  }

  // Helper method to show notifications
  private showNotification(message: string, type: 'success' | 'error'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    
    setTimeout(() => {
      this.notificationMessage = null;
      this.notificationType = null;
    }, 5000);
  }

  // Format TypeDepense enum value to readable string with spaces
  formatTypeName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').trim();
  }
}
