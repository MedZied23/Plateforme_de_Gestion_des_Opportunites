import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserDto, UserService } from '../../services/user.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { NotificationService } from '../../services/notification.service';
import { OpportuniteService } from '../../services/opportunite.service';
import { AuthService } from '../../services/auth.service';
import { CreateNotificationDto } from '../../models/notification.interface';
import { Role } from '../../models/role.enum';
import { Status } from '../../enums/status.enum';

export interface ValidationDialogData {
  opportunityId: string;
  associeEnCharge: UserDto | null;
  managerEnCharge: UserDto | null;
  coManagerEnCharge: UserDto | null;
  seniorManagerEnCharge: UserDto | null;
  equipeProjet: UserDto[];
}

@Component({
  selector: 'app-validation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClickOutsideDirective
  ],
  templateUrl: './validation-dialog.component.html',
  styleUrls: ['./validation-dialog.component.css']
})
export class ValidationDialogComponent implements OnInit {
  validationForm: FormGroup;
  userControl = new FormControl('');
  selectedUsers: string[] = [];
  allMembers: UserDto[] = [];
  filteredMembers: UserDto[] = [];
  showUserDropdown = false;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<ValidationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValidationDialogData,
    private notificationService: NotificationService,
    private opportuniteService: OpportuniteService,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.validationForm = new FormGroup({
      lienPropositionTechnique: new FormControl('', [Validators.required]),
      lienPropositionFinanciere: new FormControl('', [Validators.required])
    });

    // Initialize empty arrays - will be populated in ngOnInit
    this.allMembers = [];
    this.filteredMembers = [];
  }

  ngOnInit(): void {
    // Load all users from the application
    this.userService.getUsers().subscribe({
      next: (users) => {
        // Filter out admin users from the list
        this.allMembers = users.filter(user => 
          user.role !== Role.Admin
        );
        this.filteredMembers = [...this.allMembers];
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Fallback to opportunity team members if all users can't be loaded
        this.allMembers = [
          ...this.data.equipeProjet,
          ...(this.data.associeEnCharge ? [this.data.associeEnCharge] : []),
          ...(this.data.managerEnCharge ? [this.data.managerEnCharge] : []),
          ...(this.data.coManagerEnCharge ? [this.data.coManagerEnCharge] : []),
          ...(this.data.seniorManagerEnCharge ? [this.data.seniorManagerEnCharge] : [])
        ].filter((user, index, self) => 
          self.findIndex(u => u.id === user.id) === index &&
          user.role !== Role.Admin
        );
        this.filteredMembers = [...this.allMembers];
      }
    });
  }

  showMemberSuggestions(): void {
    this.showUserDropdown = true;
    this.filteredMembers = [...this.allMembers];
  }

  filterMembers(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredMembers = [...this.allMembers];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredMembers = this.allMembers.filter(member =>
        `${member.prenom} ${member.nom}`.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term)
      );
    }
    this.showUserDropdown = true;
  }

  selectMember(member: UserDto): void {
    if (!this.selectedUsers.includes(member.id)) {
      this.selectedUsers.push(member.id);
    }
    this.userControl.setValue('');
    this.showUserDropdown = false;
  }

  removeMember(memberId: string): void {
    this.selectedUsers = this.selectedUsers.filter(id => id !== memberId);
  }

  getMemberName(memberId: string): string {
    const member = this.allMembers.find(m => m.id === memberId);
    return member ? `${member.prenom} ${member.nom}` : 'Utilisateur inconnu';
  }

  closeUserDropdown(): void {
    this.showUserDropdown = false;
  }

  close(): void {
    this.dialogRef.close();
  }

  async submitForValidation(): Promise<void> {
    if (this.validationForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      // Get current opportunity data first
      const currentOpportunity = await this.opportuniteService.getOpportuniteById(this.data.opportunityId).toPromise();
      
      if (!currentOpportunity) {
        throw new Error('Opportunity not found');
      }

      // Update opportunity with new status and Teams links
      const updatedOpportunity = {
        ...currentOpportunity,
        status: Status.Pending,
        linkTeams2: this.validationForm.get('lienPropositionTechnique')?.value || currentOpportunity.linkTeams2,
        linkPropositionFinanciere: this.validationForm.get('lienPropositionFinanciere')?.value || currentOpportunity.linkPropositionFinanciere
      };

      await this.opportuniteService.updateOpportunite(this.data.opportunityId, updatedOpportunity).toPromise();

      // Create notifications for associé en charge and selected users
      const recipientIds: string[] = [];
      
      // Add associé en charge
      if (this.data.associeEnCharge) {
        recipientIds.push(this.data.associeEnCharge.id);
      }

      // Add selected users
      recipientIds.push(...this.selectedUsers);

      if (recipientIds.length > 0) {
        // Get current user (manager) details
        const currentUser = this.authService.getStoredUser();
        const managerName = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Manager non identifié';
        
        // Get opportunity details
        let opportunityName = 'Opportunité non identifiée';
        try {
          const opportunity = await this.opportuniteService.getOpportuniteById(this.data.opportunityId).toPromise();
          if (opportunity && opportunity.nomOpportunite) {
            opportunityName = opportunity.nomOpportunite;
          }
        } catch (error) {
          console.error('Error fetching opportunity details:', error);
        }
        
        // Generate submission date
        const submissionDate = new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const notification: CreateNotificationDto = {
          recipientIds: recipientIds,
          senderId: this.authService.getCurrentUserId() || undefined,
          title: `Validation requise - ${opportunityName}`,
          body: `${managerName} a soumis l'opportunité "${opportunityName}" pour validation le ${submissionDate}. Les propositions technique et financière sont disponibles pour révision.`,
          opportuniteId: this.data.opportunityId
        };

        await this.notificationService.createNotification(notification).toPromise();
      }

      this.dialogRef.close({
        success: true,
        lienPropositionTechnique: this.validationForm.get('lienPropositionTechnique')?.value,
        lienPropositionFinanciere: this.validationForm.get('lienPropositionFinanciere')?.value,
        selectedUsers: this.selectedUsers
      });

    } catch (error) {
      console.error('Error submitting for validation:', error);
      // Handle error appropriately    } finally {
      this.isSubmitting = false;
    }
  }
}
