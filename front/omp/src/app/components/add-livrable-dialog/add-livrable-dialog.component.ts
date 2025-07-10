import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface AddLivrableDialogData {
  phaseId: number;
  maxWeeks: number;
  phaseNumero?: number;
}

export interface LivrableDialogResult {
  name: string;
  startWeek: number;
  endWeek: number;
  phaseId: number;
  phaseNumero?: number;
}

@Component({
  selector: 'app-add-livrable-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './add-livrable-dialog.component.html',
  styleUrl: './add-livrable-dialog.component.css'
})
export class AddLivrableDialogComponent {
  livrable: LivrableDialogResult;

  constructor(
    public dialogRef: MatDialogRef<AddLivrableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddLivrableDialogData
  ) {    this.livrable = {
      name: '',
      startWeek: undefined as any,
      endWeek: undefined as any,
      phaseId: data.phaseId,
      phaseNumero: data.phaseNumero
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.livrable.name.trim()) {
      return; // Don't allow empty livrable names
    }
    
    if (this.livrable.startWeek > this.livrable.endWeek) {
      return; // Don't allow start week greater than end week
    }
    
    if (this.livrable.startWeek <= 0 || this.livrable.endWeek <= 0) {
      return; // Don't allow non-positive weeks
    }
    
    if (this.livrable.startWeek > this.data.maxWeeks || this.livrable.endWeek > this.data.maxWeeks) {
      return; // Don't allow weeks beyond the maximum
    }
    
    this.dialogRef.close(this.livrable);
  }
  
  // Helper for showing the duration in the UI
  calculateDuration(): number {
    return this.livrable.endWeek - this.livrable.startWeek + 1;
  }
}
