import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskOpportuniteDto } from '../../models/task-opportunite.interface';
import { UserDto } from '../../services/user.service';
import { TaskNameService } from '../../services/task-name.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { TaskName } from '../../enums/task-name.enum';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface TaskAssignmentDialogData {
  task: TaskOpportuniteDto;
  associeEnCharge: UserDto | null;
  managerEnCharge: UserDto | null;
  coManagerEnCharge: UserDto | null;
  seniorManagerEnCharge: UserDto | null;
  equipeProjet: UserDto[];
  canAssign: boolean;
}

@Component({
  selector: 'app-task-assignment-dialog',  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClickOutsideDirective
  ],
  templateUrl: './task-assignment-dialog.component.html',
  styleUrls: ['./task-assignment-dialog.component.css']
})
export class TaskAssignmentDialogComponent implements OnInit {  userControl = new FormControl('');
  deadlineControl = new FormControl('');
  selectedMembers: string[] = [];
  allMembers: UserDto[] = [];
  filteredMembers: UserDto[] = [];
  showUserDropdown = false;
  minDate: string;  constructor(
    public dialogRef: MatDialogRef<TaskAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskAssignmentDialogData,
    private taskNameService: TaskNameService
  ) {
    // Initialize selected members from the equipe dictionary
    if (data.task.equipe && typeof data.task.equipe === 'object') {
      this.selectedMembers = Object.keys(data.task.equipe);
    } else {
      this.selectedMembers = [];
    }

    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    // If task has an existing deadline, set it
    if (data.task.dateDone) {
      const deadlineDate = new Date(data.task.dateDone);
      this.deadlineControl.setValue(deadlineDate.toISOString().split('T')[0]);
    }    // Combine all team members into one array
    this.allMembers = [
      ...(data.associeEnCharge ? [data.associeEnCharge] : []),
      ...(data.managerEnCharge ? [data.managerEnCharge] : []),
      ...(data.coManagerEnCharge ? [data.coManagerEnCharge] : []),
      ...(data.seniorManagerEnCharge ? [data.seniorManagerEnCharge] : []),
      ...data.equipeProjet
    ];
  }ngOnInit() {
    // Initialize filtered members without showing dropdown
    this.filterMembers(this.userControl.value);
  }

  // Show member suggestions dropdown
  showMemberSuggestions(): void {
    this.showUserDropdown = true;
    this.filterMembers(this.userControl.value);
  }

  // Filter members based on input
  filterMembers(value: any): void {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    this.filteredMembers = this.allMembers.filter(member => 
      `${member.prenom} ${member.nom}`.toLowerCase().includes(filterValue) &&
      !this.selectedMembers.includes(member.id)
    );
  }
  
  // Select a member from the dropdown
  selectMember(member: UserDto): void {
    if (!this.selectedMembers.includes(member.id)) {
      this.selectedMembers.push(member.id);
    }
    this.userControl.setValue('');
    this.showUserDropdown = false;
  }

  // Close user dropdown when clicking outside
  closeUserDropdown(): void {
    this.showUserDropdown = false;
  }

  removeMember(memberId: string) {
    const index = this.selectedMembers.indexOf(memberId);
    if (index >= 0) {
      this.selectedMembers.splice(index, 1);
    }
  }
  save() {
    const deadline = this.deadlineControl.value ? new Date(this.deadlineControl.value) : null;
    
    this.dialogRef.close({
      assignedMembers: this.selectedMembers,
      deadline: deadline
    });
  }

  close() {
    this.dialogRef.close();
  }
  getMemberName(memberId: string): string {
    const member = this.allMembers.find(m => m.id === memberId);
    return member ? `${member.prenom} ${member.nom}` : 'Membre inconnu';
  }
  getRoleSuffix(memberId: string): string {
    return '';
  }  // Get task display name (handles both regular and manual tasks)
  getTaskDisplayName(task: TaskOpportuniteDto): string {
    if (task.newName) {
      return task.newName;
    }

    return this.taskNameService.getFrenchTaskName(task.name);
  }

  // Get assigned member IDs from the equipe dictionary
  getAssignedMemberIds(): string[] {
    if (!this.data.task.equipe || typeof this.data.task.equipe !== 'object') {
      return [];
    }
    return Object.keys(this.data.task.equipe);
  }
}
