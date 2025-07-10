import { Component, OnInit, Input, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { ProfilService } from '../../services/profil.service';
import { LivrableService } from '../../services/livrable.service';
import { PhaseService } from '../../services/phase.service';
import { PartenaireService, PartenaireDto } from '../../services/partenaire.service';
import { DocumentExportService } from '../../services/document-export.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ProfilDto } from '../../models/profil.interface';
import { LivrableDto } from '../../models/livrable.interface';
import { Phase } from '../../models/phase.interface';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { FinancialNavigationComponent } from '../financial-navigation/financial-navigation.component';

// Interface for grouped phase data
interface PhaseWithLivrables {
  phase: Phase;
  livrables: LivrableDto[];
  colSpan: number;
}

// Interface for entity data to display in the table
interface EntiteData {
  id: string;
  name: string;
  budget: number;
  nombreHJ: number;
  pourcentHJ: number;
  pourcentBudget: number;
  color?: string; // Color for the charts
}

@Component({
  selector: 'app-display-feuil-one',
  standalone: true,
  imports: [CommonModule, FinancialNavigationComponent],
  templateUrl: './display-feuil-one.component.html',
  styleUrl: './display-feuil-one.component.css'
})
export class DisplayFeuilOneComponent implements OnInit, AfterViewInit {
  @Input() propositionId: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  
  // Canvas references for charts
  @ViewChild('hjChartCanvas') hjChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('budgetChartCanvas') budgetChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Chart instances
  private hjChart: Chart | null = null;
  private budgetChart: Chart | null = null;
  
  // EY Yellow color
  private readonly EY_YELLOW = '#FFE600';
  
  // Predefined colors for entities
  private chartColors = [
    '#4E79A7', // Blue
    '#F28E2B', // Orange
    '#E15759', // Red
    '#76B7B2', // Teal
    '#59A14F', // Green
    '#EDC948', // Yellow
    '#B07AA1', // Purple
    '#FF9DA7', // Pink
    '#9C755F', // Brown
    '#BAB0AC'  // Gray
  ];
  
  // Data properties
  profiles: ProfilDto[] = [];
  livrables: LivrableDto[] = [];
  phases: Phase[] = [];
  phaseMap: Map<string, Phase> = new Map();
  matrixData: number[][] = [];
  propositionDetails: any = null;
  averageTJM: number | null = null; // Added property for average TJM
  totalCost: number | null = null; // Added property for total cost
  
  // New property to hold grouped phases with their livrables
  groupedPhases: PhaseWithLivrables[] = [];
  
  // New property to track if we have livrable totals data
  hasLivrableTotals: boolean = false;
  
  // New property to hold entity data
  entitiesData: EntiteData[] = [];
  
  // New property to track PDF export status
  isExportingPdf: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propositionFinanciereService: PropositionFinanciereService,
    private profilService: ProfilService,
    private livrableService: LivrableService,
    private phaseService: PhaseService,
    private partenaireService: PartenaireService,
    private documentExportService: DocumentExportService // Inject DocumentExportService
  ) {}
  
  ngOnInit() {
    // Get propositionId from multiple sources with priority order
    this.route.queryParams.subscribe(params => {
      if (params['propositionId']) {
        this.propositionId = params['propositionId'];
        console.log('[DisplayFeuilOne] Using propositionId from query params:', this.propositionId);
        // Store in localStorage for persistence
        localStorage.setItem('current_proposition_id', this.propositionId);
        this.loadAllData();
      } else {
        // Fallback to navigation state
        const state = history.state;
        if (state && state.propositionId) {
          this.propositionId = state.propositionId;
          console.log('[DisplayFeuilOne] Using propositionId from state:', this.propositionId);
          // Store in localStorage for persistence
          localStorage.setItem('current_proposition_id', this.propositionId);
          this.loadAllData();
        } else {
          // Try to recover from localStorage as last resort
          const storedId = localStorage.getItem('current_proposition_id');
          if (storedId) {
            this.propositionId = storedId;
            console.log('[DisplayFeuilOne] Recovered propositionId from localStorage:', this.propositionId);
            this.loadAllData();
          } else {
            this.errorMessage = "No proposition ID provided.";
          }
        }
      }
    });
  }
  
  /**
   * Ensure charts are initialized when the view is ready
   */
  ngAfterViewInit() {
    // Try to render charts on initial view load
    setTimeout(() => this.renderCharts(), 500);
  }
  
  loadAllData() {
    if (!this.propositionId) {
      this.errorMessage = "No proposition ID available.";
      return;
    }
    
    this.isLoading = true;
    
    // Load proposition data including matrixData
    this.propositionFinanciereService.getPropositionFinanciereById(this.propositionId).subscribe({
      next: (proposition) => {
        console.log('[DisplayFeuilOneComponent] Loaded proposition data:', proposition);
        this.propositionDetails = proposition;
        
        // Extract average TJM from proposition details
        this.averageTJM = proposition.averageTJM || null;
        
        // Extract total cost from proposition details
        this.totalCost = proposition.totalCost || null;
        
        // Process entity data if available
        this.processEntityData(proposition);
        
        if (proposition && proposition.matricePL) {
          this.matrixData = proposition.matricePL;
          
          // Now fetch profiles, livrables, and phases
          forkJoin({
            profiles: this.profilService.getProfilsByPropositionFinanciere(this.propositionId),
            livrables: this.livrableService.getLivrablesByPropositionFinanciereId(this.propositionId), // Use the specialized method
            phases: this.phaseService.getPhasesByPropositionId(this.propositionId) // Fetch phases for this proposition
          }).subscribe({
            next: (result) => {
              // Sort profiles by numero property
              this.profiles = [...result.profiles].sort((a, b) => {
                // Handle null or undefined numero values by placing them at the end
                if (a.numero === undefined || a.numero === null) return 1;
                if (b.numero === undefined || b.numero === null) return -1;
                return a.numero - b.numero;
              });
              
              // Store phases and create a map for quick lookup
              this.phases = result.phases;
              
              // Fix: Create a map of phase id to phase object, filtering out phases with undefined ids
              this.phaseMap = new Map(
                this.phases
                  .filter(phase => phase.id !== undefined)
                  .map(phase => [phase.id as string, phase])
              );
              
              // Use livrables as returned by the service, they are already filtered by proposition ID
              let filteredLivrables: LivrableDto[] = result.livrables;
              
              // Sort livrables by numero property
              this.livrables = filteredLivrables.sort((a, b) => {
                // Handle null or undefined numero values by placing them at the end
                if (a.numero === undefined || a.numero === null) return 1;
                if (b.numero === undefined || b.numero === null) return -1;
                return a.numero - b.numero;
              });
              
              // Check if we have totalParLivrable data
              this.hasLivrableTotals = this.livrables.some(livrable => 
                livrable.totalParLivrable !== undefined || livrable.pourcentage !== undefined
              );
              
              // Now group livrables by phase
              this.groupedPhases = this.groupLivrablesByPhase(this.livrables);
              
              console.log('[DisplayFeuilOneComponent] Profiles loaded and sorted by numero:', this.profiles);
              console.log('[DisplayFeuilOneComponent] Livrables loaded and sorted by numero:', this.livrables);
              console.log('[DisplayFeuilOneComponent] Phases loaded:', this.phases);
              console.log('[DisplayFeuilOneComponent] Grouped phases:', this.groupedPhases);
              this.isLoading = false;
            },
            error: (error) => {
              console.error('[DisplayFeuilOneComponent] Error loading profiles, livrables, or phases:', error);
              this.errorMessage = "Error loading data.";
              this.isLoading = false;
            }
          });
        } else {
          this.errorMessage = "No matrix data found in the proposition.";
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('[DisplayFeuilOneComponent] Error loading proposition data:', error);
        this.errorMessage = "Error loading proposition data.";
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Group livrables by phase, merging consecutive livrables from the same phase
   */
  groupLivrablesByPhase(livrables: LivrableDto[]): PhaseWithLivrables[] {
    const result: PhaseWithLivrables[] = [];
    
    // First, group livrables by phaseId
    const groupedByPhase = new Map<string, LivrableDto[]>();
    
    livrables.forEach(livrable => {
      if (!livrable.idPhase) {
        // Handle livrables without a phase
        const noPhaseKey = 'no-phase';
        if (!groupedByPhase.has(noPhaseKey)) {
          groupedByPhase.set(noPhaseKey, []);
        }
        groupedByPhase.get(noPhaseKey)?.push(livrable);
      } else {
        // Group by actual phase ID
        if (!groupedByPhase.has(livrable.idPhase)) {
          groupedByPhase.set(livrable.idPhase, []);
        }
        groupedByPhase.get(livrable.idPhase)?.push(livrable);
      }
    });
    
    // Convert the map to our PhaseWithLivrables interface
    groupedByPhase.forEach((phaseLivrables, phaseId) => {
      const phase = phaseId === 'no-phase' 
        ? { id: 'no-phase', nom: 'Phase non définie' } as Phase
        : this.phaseMap.get(phaseId) || { id: phaseId, nom: 'Phase inconnue' } as Phase;
      
      result.push({
        phase: phase,
        livrables: phaseLivrables,
        colSpan: phaseLivrables.length
      });
    });
    
    // Sort by phase number if available
    result.sort((a, b) => {
      const numA = a.phase.numero || 999;
      const numB = b.phase.numero || 999;
      return numA - numB;
    });
    
    return result;
  }
  
  // Get the phase name for a livrable
  getPhaseName(livrable: LivrableDto): string {
    if (!livrable.idPhase) return 'Phase non définie';
    const phase = this.phaseMap.get(livrable.idPhase);
    return phase ? phase.nom || `Phase ${phase.numero}` : 'Phase non définie';
  }
  
  // Get livrable column indices within matrix
  getLivrableColumnIndices(livrables: LivrableDto[]): number[] {
    return livrables.map(livrable => this.livrables.findIndex(l => l.id === livrable.id))
                    .filter(index => index !== -1);
  }
  
  // Get the matrix column index for a specific livrable
  getLivrableColumnIndex(livrable: LivrableDto): number {
    return this.livrables.findIndex(l => l.id === livrable.id);
  }
  
  // Get cell value from matrix data
  getCellValue(profileIndex: number, livrableColumnIndex: number): number {
    return this.matrixData[profileIndex] && this.matrixData[profileIndex][livrableColumnIndex] 
      ? this.matrixData[profileIndex][livrableColumnIndex] 
      : 0;
  }
  
  // Track function for ngFor optimization
  trackById(index: number, item: any): string {
    return item.id;
  }
  
  trackByPhaseId(index: number, item: PhaseWithLivrables): string {
    return item.phase.id || `phase-${index}`;
  }
  
  goBackToOffre() {
    this.router.navigate(['/layout/offre-financiere'], {
      queryParams: { propositionId: this.propositionId }
    });
  }
  
  /**
   * Format percentage values for display
   */
  formatPercentage(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return `${value.toFixed(2)}%`;
  }
  
  /**
   * Format total values for display
   */
  formatTotal(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return value.toString();
  }
  
  /**
   * Format currency values with 2 decimal places
   */
  formatCurrency(value: number | null | undefined): string {
    if (value === undefined || value === null) return '-';
    return value.toFixed(2);
  }
  
  /**
   * Process entity data from proposition details
   */
  processEntityData(proposition: any) {
    this.entitiesData = [];
    
    // Add EY as an entity if data is available
    if (proposition.budgetPartEY !== undefined || 
        proposition.nbrHJPartEY !== undefined || 
        proposition.pourcentHjEY !== undefined ||
        proposition.pourcentBudgetEY !== undefined) {
      
      this.entitiesData.push({
        id: 'EY',
        name: 'EY',
        budget: proposition.budgetPartEY || 0,
        nombreHJ: proposition.nbrHJPartEY || 0,
        pourcentHJ: proposition.pourcentHjEY || 0,
        pourcentBudget: proposition.pourcentBudgetEY || 0,
        color: this.EY_YELLOW  // Assign EY yellow color
      });
    }
    
    // Add partner entities if available
    if (proposition.budgetsPartenaires && Object.keys(proposition.budgetsPartenaires).length > 0) {
      // Get partner IDs from budgets
      const partnerIds = Object.keys(proposition.budgetsPartenaires);
      
      // For each partner ID, fetch the partner data and create an entity entry
      partnerIds.forEach((partnerId, index) => {
        // Use forkJoin to get the partner details asynchronously
        this.partenaireService.getPartenaireById(partnerId).pipe(
          catchError(error => {
            console.error(`Failed to fetch partner with ID ${partnerId}:`, error);
            // Return a default partner with the ID as name if fetch fails
            return of({
              id: partnerId,
              nom: `Partner ${partnerId}`
            } as PartenaireDto);
          })
        ).subscribe(partner => {
          this.entitiesData.push({
            id: partnerId,
            name: partner.nom || `Partner ${partnerId}`,
            budget: proposition.budgetsPartenaires[partnerId] || 0,
            nombreHJ: proposition.nbrHJPartenaires?.[partnerId] || 0,
            pourcentHJ: proposition.pourcentHjPartenaires?.[partnerId] || 0,
            pourcentBudget: proposition.pourcentBudgetPartenaires?.[partnerId] || 0,
            color: this.chartColors[(index + 1) % this.chartColors.length] // Use colors in a cycle
          });
          
          console.log(`[DisplayFeuilOneComponent] Added partner entity: ${partner.nom}`);
          
          // Try to render charts whenever entity data changes
          setTimeout(() => this.renderCharts(), 100);
        });
      });
    } else {
      // If there are no partners and we have EY data, try to render charts immediately
      if (this.entitiesData.length > 0) {
        setTimeout(() => this.renderCharts(), 100);
      }
    }
    
    console.log('[DisplayFeuilOneComponent] Processed entity data:', this.entitiesData);
  }
  
  /**
   * Render the pie charts directly
   */
  renderCharts() {
    console.log('[DisplayFeuilOneComponent] Attempting to render charts with entities:', this.entitiesData);
    
    // Get canvas elements directly instead of relying on ViewChild which might not be ready
    const hjCanvas = document.getElementById('hjChartCanvas') as HTMLCanvasElement;
    const budgetCanvas = document.getElementById('budgetChartCanvas') as HTMLCanvasElement;
    
    if (!hjCanvas || !budgetCanvas) {
      console.log('[DisplayFeuilOneComponent] Canvas elements not found in DOM, retrying in 200ms');
      setTimeout(() => this.renderCharts(), 200);
      return;
    }
    
    if (this.entitiesData.length === 0) {
      console.log('[DisplayFeuilOneComponent] No entity data available for charts');
      return;
    }
    
    // Clean up any existing charts
    if (this.hjChart) {
      this.hjChart.destroy();
      this.hjChart = null;
    }
    
    if (this.budgetChart) {
      this.budgetChart.destroy();
      this.budgetChart = null;
    }
    
    try {
      // Prepare data for charts
      const labels = this.entitiesData.map(e => e.name);
      const hjData = this.entitiesData.map(e => e.pourcentHJ || 0);
      const budgetData = this.entitiesData.map(e => e.pourcentBudget || 0);
      const colors = this.entitiesData.map(e => e.color || '#CCCCCC');
      
      console.log('[DisplayFeuilOneComponent] Chart data prepared:', { 
        labels, hjData, budgetData, colors 
      });
      
      // Create the HJ chart
      this.hjChart = new Chart(hjCanvas, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: hjData,
            backgroundColor: colors
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15
              }
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value.toFixed(2)}%`;
                }
              }
            }
          }
        }
      });
      
      // Create the budget chart
      this.budgetChart = new Chart(budgetCanvas, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: budgetData,
            backgroundColor: colors
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15
              }
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value.toFixed(2)}%`;
                }
              }
            }
          }
        }
      });
      
      console.log('[DisplayFeuilOneComponent] Charts created successfully');
    } catch (error) {
      console.error('[DisplayFeuilOneComponent] Error creating charts:', error);
    }
  }
  
  /**
   * Export the current view as a PDF document with settings to prevent table splitting
   */
  exportToPdf(): void {
    this.isExportingPdf = true;
    
    // Use setTimeout to allow UI to update and show loading state
    setTimeout(() => {
      try {
        // Generate filename using proposition title or default name
        const filename = this.propositionDetails?.titre 
          ? `Feuil_One_${this.propositionDetails.titre.replace(/\s+/g, '_')}`
          : `Feuil_One_Proposition_${this.propositionId}`;
          
        // Define options with landscape orientation and table-friendly page breaks
        const options = {
          orientation: 'landscape' as 'landscape',
          format: 'a4',
          pagebreak: {
            mode: ['avoid-all'],
            avoid: ['.table-container', 'table', '.matrix-table', '.livrable-totals-table', 
                   '.phase-totals-table', '.profile-totals-table', '.entity-totals-table',
                   '.chart-section', '.charts-container']
          }
        };
        
        this.documentExportService.exportToPdf('feuilOneContent', filename, options);
      } catch (error) {
        console.error('[DisplayFeuilOneComponent] Error exporting PDF:', error);
      } finally {
        // Reset export state after a short delay
        setTimeout(() => {
          this.isExportingPdf = false;
        }, 1000);
      }
    }, 100);
  }
}
