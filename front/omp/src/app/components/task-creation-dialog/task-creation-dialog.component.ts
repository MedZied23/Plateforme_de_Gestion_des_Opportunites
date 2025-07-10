import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskOpportuniteService } from '../../services/task-opportunite.service';
import { TaskType } from '../../enums/task-type.enum';
import { Nature } from '../../enums/nature.enum';

export interface TaskCreationDialogData {
  opportuniteId: string;
  taskType: TaskType;
  nature: Nature;
}

@Component({
  selector: 'app-task-creation-dialog',
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './task-creation-dialog.component.html',
  styleUrls: ['./task-creation-dialog.component.css']
})
export class TaskCreationDialogComponent implements OnInit {
  taskNameControl = new FormControl('', [Validators.required]);
  percentageControl = new FormControl(0, [Validators.required, Validators.min(0), Validators.max(100)]);
  
  isLoading = false;
  
  constructor(
    public dialogRef: MatDialogRef<TaskCreationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskCreationDialogData,
    private taskOpportuniteService: TaskOpportuniteService
  ) {}

  ngOnInit() {
    // For administrative tasks, remove percentage validation since it's not needed
    if (!this.isOperationalTask) {
      this.percentageControl.clearValidators();
      this.percentageControl.updateValueAndValidity();
    }

    // Add dynamic slider background update
    if (this.isOperationalTask) {
      this.percentageControl.valueChanges.subscribe(value => {
        this.updateSliderBackground(value || 0);
      });
      // Set initial background
      this.updateSliderBackground(this.percentageControl.value || 0);
    }
  }

  private updateSliderBackground(value: number) {
    const percentage = Math.max(0, Math.min(100, value));
    const slider = document.getElementById('percentage') as HTMLInputElement;
    if (slider) {
      slider.style.background = `linear-gradient(to right, #00aeae 0%, #00aeae ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
    }
  }

  get isOperationalTask(): boolean {
    return this.data.taskType === TaskType.Operational;
  }

  get isFormValid(): boolean {
    if (this.isOperationalTask) {
      return this.taskNameControl.valid && this.percentageControl.valid;
    } else {
      // For administrative tasks, only task name is required
      return this.taskNameControl.valid;
    }
  }  get taskTypeLabel(): string {
    return this.data.taskType === TaskType.Administrative ? 'administrative' : 'opérationnelle';
  }

  async createTask() {
    if (!this.isFormValid || this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {      const taskData = {
        opportuniteId: this.data.opportuniteId,
        newName: this.taskNameControl.value!.trim(),
        type: this.data.taskType === TaskType.Administrative ? 1 : 0,
        percentage: this.isOperationalTask ? this.percentageControl.value! : 0, // Set to 0 for administrative tasks
        done: false,
        nature: this.data.nature === Nature.AMI ? 0 : 1,
        equipe: {}, // Initialize as empty dictionary for the new structure
        statut: undefined // For manual tasks
      };

      const createdTask = await this.taskOpportuniteService.createTask(taskData).toPromise();

      if (createdTask) {
        this.dialogRef.close(true); // Return true to indicate successful creation
      }
    } catch (error) {
      console.error('Error creating task:', error);
      this.isLoading = false;
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}