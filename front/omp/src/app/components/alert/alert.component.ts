import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface AlertDialogData {
  message: string;
  buttonText: string;
}

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
