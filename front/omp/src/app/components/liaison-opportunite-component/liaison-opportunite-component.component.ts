import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { OpportuniteService, OpportuniteDto } from '../../services/opportunite.service';
import { PartenaireService, PartenaireDto } from '../../services/partenaire.service';
import { OfferOpportunityWindowComponent } from '../offer-opportunity-window/offer-opportunity-window.component';
import { ConfirmComponent } from '../confirm/confirm.component';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-liaison-opportunite-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './liaison-opportunite-component.component.html',
  styleUrl: './liaison-opportunite-component.component.css'
})
export class LiaisonOpportuniteComponentComponent implements OnInit, OnChanges {
  @Input() currentOpportunityId: string | null | undefined = null;
  @Output() opportunityLinked = new EventEmitter<string>();
  @Output() opportunityUnlinked = new EventEmitter<void>();

  isLinkedToOpportunity: boolean = false;
  selectedOpportunityId: string | null = null;
  opportunities: OpportuniteDto[] = [];
  selectedOpportunityPartners: PartenaireDto[] = [];

  constructor(
    private opportuniteService: OpportuniteService,
    private partenaireService: PartenaireService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadOpportunities();
  }
  ngOnChanges(changes: SimpleChanges): void {
    // When currentOpportunityId changes (provided from parent component)
    if (changes['currentOpportunityId']) {
      console.log('[LiaisonOpportuniteComponent] currentOpportunityId changed:', {
        previous: changes['currentOpportunityId'].previousValue,
        current: changes['currentOpportunityId'].currentValue,
        firstChange: changes['currentOpportunityId'].firstChange
      });
      
      this.selectedOpportunityId = changes['currentOpportunityId'].currentValue;
      this.isLinkedToOpportunity = !!this.selectedOpportunityId;
      
      if (this.isLinkedToOpportunity) {
        // Reload opportunities to ensure current one is in the list
        this.loadOpportunities();
        this.loadPartnersFromOpportunity();
      }
    }
  }    loadOpportunities() {
    console.log('Loading opportunities...');
    this.opportuniteService.getOpportunites().subscribe({
      next: (data) => {
        console.log('Raw response data:', data);
        
        // Check if data is a paginated response
        if (data && typeof data === 'object' && 'items' in data) {
          // If paginated, use the items array
          this.opportunities = (data as any).items;
        } else {
          // If not paginated, use the data as is
          this.opportunities = data;
        }
        
        console.log('Processed opportunities:', {
          length: this.opportunities.length,
          isEmpty: this.opportunities.length === 0,
          firstItem: this.opportunities[0],
          hasPropositionFinanciere: this.opportunities.some(o => o.idPropositionFinanciere)
        });
        
        if (this.currentOpportunityId) {
          console.log('Current opportunity:', this.getOpportunityName());
        }
      },
      error: (error) => {
        console.error('Error loading opportunities:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
      }
    });
  }

  loadPartnersFromOpportunity() {
    if (this.isLinkedToOpportunity && this.selectedOpportunityId) {
      const selectedOpportunity = this.opportunities.find(opp => opp.id === this.selectedOpportunityId);
      
      if (selectedOpportunity?.partenaireId?.length) {
        const partenaireRequests = selectedOpportunity.partenaireId.map(id => 
          this.partenaireService.getPartenaireById(id).pipe(
            catchError(() => of(null))
          )
        );

        forkJoin(partenaireRequests).subscribe({
          next: (partenaires: (PartenaireDto | null)[]) => {
            this.selectedOpportunityPartners = partenaires.filter(Boolean) as PartenaireDto[];
          },
          error: () => {
            console.error('Erreur lors de la récupération des partenaires');
          }
        });
      }
    }
  }

  openOpportunityDialog(): void {
    const dialogRef = this.dialog.open(OfferOpportunityWindowComponent, {
      data: { 
        opportunities: this.opportunities,
        currentOpportunityId: this.selectedOpportunityId 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedOpportunityId = result;
        this.isLinkedToOpportunity = true;
        this.loadPartnersFromOpportunity();
        this.opportunityLinked.emit(result);
      }
    });
  }
  unlinkOpportunity(): void {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir délier cette opportunité ? La proposition financière sera conservée mais ne sera plus liée à cette opportunité.',
        confirmButtonText: 'Confirmer',
        cancelButtonText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLinkedToOpportunity = false;
        this.selectedOpportunityId = null;
        this.selectedOpportunityPartners = [];
        this.opportunityUnlinked.emit();
      }
    });
  }

  getOpportunityName(): string {
    const opportunity = this.opportunities.find(o => o.id === this.selectedOpportunityId);
    return opportunity?.nomOpportunite || '';
  }
}
