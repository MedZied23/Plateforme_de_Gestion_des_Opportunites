import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { ProfilService } from '../../services/profil.service';
import { DocumentExportService } from '../../services/document-export.service';
import { FinancialNavigationComponent } from '../financial-navigation/financial-navigation.component';
import { PropositionFinanciereDto, TypeDepense } from '../../models/proposition-financiere.interface';
import { ProfilDto } from '../../models/profil.interface';

@Component({
  selector: 'app-display-final-cost',
  standalone: true,
  imports: [
    CommonModule,
    FinancialNavigationComponent
  ],
  templateUrl: './display-final-cost.component.html',
  styleUrl: './display-final-cost.component.css'
})
export class DisplayFinalCostComponent implements OnInit {
  propositionId: string | null = null;
  proposition: PropositionFinanciereDto | null = null;
  typeDepenseValues: { type: TypeDepense, name: string }[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isExportingPdf: boolean = false;
  totalLabor: number = 0;
  totalExpenses: number = 0;
  totalProject: number = 0;
  profiles: ProfilDto[] = [];
  expenseUnits: Record<string, Record<TypeDepense, number>> = {};
  expensePrices: Record<TypeDepense, number> = {
    [TypeDepense.AllocationPerDiem]: 0,
    [TypeDepense.VoyageInternationaux]: 0,
    [TypeDepense.FraisVisaTimbreVoyage]: 0,
    [TypeDepense.TransfertLocationsVoitures]: 0,
    [TypeDepense.Logement]: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propositionFinanciereService: PropositionFinanciereService,
    private profilService: ProfilService,
    private documentExportService: DocumentExportService
  ) {
    // Initialize TypeDepense values for display
    this.typeDepenseValues = Object.keys(TypeDepense)
      .filter(key => isNaN(Number(key)))
      .map(key => ({
        type: TypeDepense[key as keyof typeof TypeDepense],
        name: key
      }));
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.propositionId = params['propositionId'] || null;

      if (!this.propositionId) {
        console.error('[DisplayFinalCost] No proposition ID provided');
        this.errorMessage = "Aucune proposition financière spécifiée";
        return;
      }

      this.loadData();
    });
  }

  loadData(): void {
    if (!this.propositionId) return;

    this.isLoading = true;
    this.errorMessage = null;

    // Load proposition data first
    this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId)
      .subscribe({
        next: (proposition) => {
          this.proposition = proposition;
          console.log('[DisplayFinalCost] Loaded proposition data:', proposition);          // Initialize expense prices from proposition data
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

            // Load profiles and their expense data
            this.profilService.getProfilsByPropositionFinanciere(this.propositionId!)
              .subscribe({
                next: (profiles) => {
                  // Filter to only show profiles with expenses or terrain activity
                  const hasProfilesWithExpenses = profiles.some(p => p.totalDepense && p.totalDepense > 0);
                  if (hasProfilesWithExpenses) {
                    this.profiles = profiles.filter(p => p.totalDepense && p.totalDepense > 0);
                  } else {
                    this.profiles = profiles.filter(p => p.totalTerrain && p.totalTerrain > 0);
                  }
                  
                  // Initialize expense units map
                  this.expenseUnits = {};
                  this.profiles.forEach(profile => {
                    // Initialize default values for all expense types
                    this.expenseUnits[profile.id] = {
                      [TypeDepense.AllocationPerDiem]: 0,
                      [TypeDepense.VoyageInternationaux]: 0,
                      [TypeDepense.FraisVisaTimbreVoyage]: 0,
                      [TypeDepense.TransfertLocationsVoitures]: 0,
                      [TypeDepense.Logement]: 0
                    };

                    // Update with actual values if available
                    if (profile.unitsDepense) {
                      Object.entries(profile.unitsDepense).forEach(([key, value]) => {
                        const typeKey = isNaN(Number(key)) ? 
                          TypeDepense[key as keyof typeof TypeDepense] : 
                          Number(key) as TypeDepense;
                        
                        if (typeKey !== undefined && value !== undefined) {
                          this.expenseUnits[profile.id][typeKey] = Number(value);
                        }
                      });
                    }
                  });

                  // Calculate totals
                  this.calculateTotals();
                  this.isLoading = false;
                },
                error: (error) => {
                  console.error('[DisplayFinalCost] Error loading profiles:', error);
                  this.errorMessage = "Erreur lors du chargement des profils";
                  this.isLoading = false;
                }
              });
          } else {
            this.isLoading = false;
            this.errorMessage = "Aucune données de dépenses trouvées";
          }
        },
        error: (error) => {
          console.error('[DisplayFinalCost] Error loading proposition:', error);
          this.errorMessage = "Erreur lors du chargement des données de la proposition";
          this.isLoading = false;
        }
      });
  }

  calculateTotals(): void {
    if (!this.proposition) return;    // Get total labor cost
    this.totalLabor = this.proposition.totalCost || 0;

    // Get total expenses from the proposition
    this.totalExpenses = this.proposition.totalExpenses || 0;

    // Calculate total project cost
    this.totalProject = this.totalLabor + this.totalExpenses;
  }

  getTotalUnitsForType(type: TypeDepense): number {
    let total = 0;
    this.profiles.forEach(profile => {
      total += this.expenseUnits[profile.id][type] || 0;
    });
    return total;
  }
  getTotalForExpenseType(type: TypeDepense): number {
    const pricePerUnit = this.expensePrices[type];
    const totalUnits = this.getTotalUnitsForType(type);
    return pricePerUnit * totalUnits;
  }

  getPercentageForExpenseType(type: TypeDepense): string {
    if (!this.totalExpenses) return '0.0';
    const typeTotal = this.getTotalForExpenseType(type);
    return ((typeTotal / this.totalExpenses) * 100).toFixed(1);
  }
  getTotalForProfile(profileId: string): string {
    let total = 0;
    Object.values(TypeDepense)
      .filter(key => !isNaN(Number(key)))
      .forEach(type => {
        const typeDepense = Number(type) as TypeDepense;
        const units = this.expenseUnits[profileId][typeDepense] || 0;
        const pricePerUnit = this.expensePrices[typeDepense];
        total += units * pricePerUnit;
      });
    
    return total.toFixed(2);
  }

  formatValue(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2);
  }

  goBack(): void {
    this.router.navigate(['/layout/display-propositions-financieres']);
  }

  exportToPdf(): void {
    if (!this.propositionId) return;

    this.isExportingPdf = true;

    setTimeout(() => {
      try {
        const filename = this.proposition?.nom
          ? `Feuil_Trois_${this.proposition.nom.replace(/\s+/g, '_')}`
          : `Feuil_Trois_Proposition_${this.propositionId}`;

        const options = {
          orientation: 'portrait' as 'portrait',
          format: 'a4',
          pagebreak: { mode: ['avoid-all'] }
        };

        this.documentExportService.exportToPdf('feuilTroisContent', filename, options);
      } catch (error) {
        console.error('[DisplayFinalCost] Error exporting PDF:', error);
      } finally {
        setTimeout(() => {
          this.isExportingPdf = false;
        }, 1000);
      }
    }, 100);
  }

  formatTypeName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').trim();
  }
}
