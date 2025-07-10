import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { OpportuniteDto } from '../../services/opportunite.service';

@Component({
  selector: 'app-offer-opportunity-window',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './offer-opportunity-window.component.html',
  styleUrl: './offer-opportunity-window.component.css'
})
export class OfferOpportunityWindowComponent {
  selectedOpportunityId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<OfferOpportunityWindowComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      opportunities: OpportuniteDto[],
      currentOpportunityId: string | null 
    }
  ) {
    // Pre-select the current opportunity if one exists
    this.selectedOpportunityId = data.currentOpportunityId;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.selectedOpportunityId) {
      this.dialogRef.close(this.selectedOpportunityId);
    }
  }
}
