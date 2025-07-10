import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface AddPhaseDialogData {
  title: string;
}

@Component({
  selector: 'app-add-phase-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './add-phase-dialog.component.html',
  styleUrl: './add-phase-dialog.component.css'
})
export class AddPhaseDialogComponent {
  phaseName: string = '';
  isCreatingPhase: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddPhaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddPhaseDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.phaseName.trim()) {
      return; // Don't allow empty phase names
    }
    
    this.dialogRef.close(this.phaseName);
  }
}
