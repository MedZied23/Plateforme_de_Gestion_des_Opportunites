import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-add-phase-bullet-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    MatDialogModule,
    ClickOutsideDirective
  ],
  templateUrl: './add-phase-bullet-dialog.component.html',
  styleUrl: './add-phase-bullet-dialog.component.css'
})
export class AddPhaseBulletDialogComponent implements OnInit {
  bulletForm: FormGroup;
  bulletEditModes: boolean[] = [];
  bulletExpandStates: boolean[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddPhaseBulletDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.bulletForm = this.fb.group({
      phaseName: ['', Validators.required],
      bullets: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // If there's existing data, populate the form
    if (this.data) {
      // Set the phase name if it exists
      if (this.data.phaseName) {
        this.bulletForm.patchValue({ phaseName: this.data.phaseName });
      }
      
      // Add bullet points if they exist
      if (this.data.bullets) {
        this.data.bullets.forEach((bullet: any) => {
          this.addBulletToForm(bullet.text, bullet.subBullets || []);
        });
      }
    }
  }

  // Helper getter for bullets array
  get bulletArray(): FormArray {
    return this.bulletForm.get('bullets') as FormArray;
  }

  // Add a new bullet point with optional text and sub-bullets
  addBulletToForm(text: string = '', subBullets: string[] = []): void {
    const bulletGroup = this.fb.group({
      text: [text, Validators.required],
      subBullets: this.fb.array(
        subBullets.map(s => this.fb.control(s, Validators.required))
      )
    });
    
    this.bulletArray.push(bulletGroup);
  }

  // Get sub-bullets array for a specific bullet point
  getSubBulletsArray(index: number): FormArray {
    return (this.bulletArray.at(index) as FormGroup).get('subBullets') as FormArray;
  }
  // Add a new bullet point
  addBullet(): void {
    if (this.hasEmptyEditedBullet()) {
      return;
    }
    
    this.addBulletToForm();
    // Add at least one empty sub-bullet
    this.addSubBullet(this.bulletArray.length - 1);
    
    const newIndex = this.bulletArray.length - 1;
    this.ensureBulletArraysSize();
    // Set all bullets to display mode first
    this.bulletEditModes = this.bulletEditModes.map(() => false);
    // Then set only the new bullet to edit mode
    this.bulletEditModes[newIndex] = true;
    for (let i = 0; i < this.bulletArray.length - 1; i++) {
      this.onBulletBlur(i);
    }
  }

  // Add sub-bullet to a bullet point
  addSubBullet(bulletIndex: number, value: string = ''): void {
    if (this.hasEmptySubBullet(bulletIndex)) return;
    
    const subBulletsArray = this.getSubBulletsArray(bulletIndex);
    subBulletsArray.push(this.fb.control(value, Validators.required));
    
    this.ensureBulletArraysSize();
    this.bulletEditModes[bulletIndex] = true;
  }

  // Check for empty sub-bullet
  hasEmptySubBullet(bulletIndex: number): boolean {
    const subBulletsArray = this.getSubBulletsArray(bulletIndex);
    
    for (let i = 0; i < subBulletsArray.length; i++) {
      const subBullet = subBulletsArray.at(i).value;
      if (!subBullet || subBullet.trim() === '') {
        return true;
      }
    }
    return false;
  }

  // Remove a bullet point
  removeBullet(index: number): void {
    this.bulletArray.removeAt(index);
    this.bulletEditModes.splice(index, 1);
    this.bulletExpandStates.splice(index, 1);
  }

  // Remove a sub-bullet
  removeSubBullet(bulletIndex: number, subBulletIndex: number): void {
    const subBulletsArray = this.getSubBulletsArray(bulletIndex);
    subBulletsArray.removeAt(subBulletIndex);
  }

  // Ensure arrays for tracking bullet states are the right size
  ensureBulletArraysSize(): void {
    const bulletCount = this.bulletArray.length;
    
    while (this.bulletEditModes.length < bulletCount) {
      this.bulletEditModes.push(true);
    }
    this.bulletEditModes = this.bulletEditModes.slice(0, bulletCount);
    
    while (this.bulletExpandStates.length < bulletCount) {
      this.bulletExpandStates.push(false);
    }
    this.bulletExpandStates = this.bulletExpandStates.slice(0, bulletCount);
  }
  // Toggle bullet edit mode
  toggleBulletEditMode(index: number): void {
    this.ensureBulletArraysSize();
    // Set all bullet edit modes to false first
    this.bulletEditModes = this.bulletEditModes.map(() => false);
    // Then set the selected bullet to edit mode
    this.bulletEditModes[index] = true;
  }

  // Toggle bullet expand state
  toggleBulletExpand(index: number, event: Event): void {
    event.stopPropagation();
    this.ensureBulletArraysSize();
    this.bulletExpandStates[index] = !this.bulletExpandStates[index];
  }

  // Handle blur event for bullet text
  onBulletBlur(index: number): void {
    const bulletGroup = this.bulletArray.at(index) as FormGroup;
    const subBulletsArray = this.getSubBulletsArray(index);
    
    if (bulletGroup.get('text')?.valid && subBulletsArray.length > 0) {
      let hasValidSubBullet = false;
      for (let i = 0; i < subBulletsArray.length; i++) {
        if (subBulletsArray.at(i).value && subBulletsArray.at(i).valid) {
          hasValidSubBullet = true;
          break;
        }
      }
      
      const lastSubBullet = subBulletsArray.length > 0 ? 
        subBulletsArray.at(subBulletsArray.length - 1).value : null;
      
      if (hasValidSubBullet && lastSubBullet && lastSubBullet.trim() !== '') {
        this.ensureBulletArraysSize();
        this.bulletEditModes[index] = false;
      }
    }
  }

  // Handle blur event for sub-bullet
  onSubBulletBlur(bulletIndex: number, subBulletIndex: number): void {
    // Intentionally empty to prevent form from switching to display mode
    // when clicking "Add" for a new sub-bullet
  }
  // Handle click outside bullet edit mode
  handleClickOutside(bulletIndex: number): void {
    const bulletGroup = this.bulletArray.at(bulletIndex) as FormGroup;
    if (bulletGroup.get('text')?.valid) {
      // Exit edit mode for the current bullet
      this.bulletEditModes[bulletIndex] = false;
      // Close all sub-bullet editing states
      this.bulletExpandStates[bulletIndex] = false;
    }
  }

  // Check if there's an open and empty bullet edit form
  hasEmptyEditedBullet(): boolean {
    for (let i = 0; i < this.bulletArray.length; i++) {
      if (this.bulletEditModes[i]) {
        const bulletGroup = this.bulletArray.at(i) as FormGroup;
        const text = bulletGroup.get('text')?.value;
        const subBulletsArray = this.getSubBulletsArray(i);
        
        if (!text || text.trim() === '') {
          return true;
        }
        
        let allSubBulletsEmpty = true;
        for (let j = 0; j < subBulletsArray.length; j++) {
          const subBullet = subBulletsArray.at(j).value;
          if (subBullet && subBullet.trim() !== '') {
            allSubBulletsEmpty = false;
            break;
          }
        }
        
        if (allSubBulletsEmpty && subBulletsArray.length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  // Handle drag and drop for bullets
  onBulletDrop(event: CdkDragDrop<any[]>): void {
    const bullets = this.bulletArray;
    moveItemInArray(bullets.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.bulletEditModes, event.previousIndex, event.currentIndex);
    moveItemInArray(this.bulletExpandStates, event.previousIndex, event.currentIndex);
    this.bulletForm.markAsDirty();
  }

  // Handle drag and drop for sub-bullets
  onSubBulletDrop(event: CdkDragDrop<any[]>, bulletIndex: number): void {
    const subBullets = this.getSubBulletsArray(bulletIndex);
    moveItemInArray(subBullets.controls, event.previousIndex, event.currentIndex);
    this.bulletForm.markAsDirty();
  }

  // Save the form
  save(): void {
    if (this.bulletForm.valid) {
      const formData = this.bulletForm.getRawValue();
      const phaseData = {
        phaseName: formData.phaseName,
        bullets: formData.bullets.map((bullet: any) => ({
          text: bullet.text,
          subBullets: bullet.subBullets
        }))
      };
      this.dialogRef.close(phaseData);
    }
  }

  // Cancel the dialog
  cancel(): void {
    this.dialogRef.close();
  }
}
