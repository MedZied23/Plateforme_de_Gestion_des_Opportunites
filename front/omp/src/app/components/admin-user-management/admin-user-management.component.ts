import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, UserDto, CreateUserRequest, UpdateUserRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Role, getRoleDisplayName } from '../../models/role.enum';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-user-management.component.html',
  styleUrl: './admin-user-management.component.css'
})
export class AdminUserManagementComponent implements OnInit {
  users: UserDto[] = [];
  showCreateForm = false;
  showEditForm = false;
  selectedUser: UserDto | null = null;
  createUserForm: FormGroup;
  editUserForm: FormGroup;
  loading = false;
  error: string | null = null;
  currentUser: any = null;

  // Role options for dropdown - showing all available roles
  roleOptions = [
    { value: Role.Admin, label: 'Admin' },
    { value: Role.Associe, label: 'Associé' },
    { value: Role.Directeur, label: 'Directeur' },
    { value: Role.SeniorManager, label: 'Senior Manager' },
    { value: Role.Manager, label: 'Manager' },
    { value: Role.AssistantManager, label: 'Assistant Manager' },
    { value: Role.Senior, label: 'Senior' },
    { value: Role.Junior, label: 'Junior' },
    { value: Role.User, label: 'User' }
  ];
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.createUserForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [0, [Validators.required]]
    });

    this.editUserForm = this.fb.group({
      id: ['', [Validators.required]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: [0, [Validators.required]]
    });
  }
  ngOnInit(): void {
    this.loadUsers();
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('Current user loaded:', this.currentUser);
      },
      error: (error) => {
        console.error('Error loading current user:', error);
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },        error: (error) => {
          console.error('Error loading users:', error);
          this.error = 'Erreur lors du chargement des utilisateurs. Veuillez réessayer.';
          this.loading = false;
        }
    });
  }
  showCreateUserForm(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.createUserForm.reset();
    // Default to User role when creating new user
    this.createUserForm.patchValue({ role: Role.User });
  }

  hideCreateForm(): void {
    this.showCreateForm = false;
    this.createUserForm.reset();
  }
  createUser(): void {
    if (this.createUserForm.valid) {
      this.loading = true;
      this.error = null;
      
      const formValues = this.createUserForm.value;
      console.log('Create form values:', formValues);
      
      const createRequest: CreateUserRequest = {
        nom: formValues.nom,
        prenom: formValues.prenom,
        email: formValues.email,
        phone: formValues.phone,
        password: formValues.password,
        role: parseInt(formValues.role) // Ensure role is a number
      };
      
      console.log('Create request payload:', createRequest);
        this.userService.createUser(createRequest).subscribe({
        next: (user) => {
          console.log('User created successfully:', user);
          this.hideCreateForm();
          this.loading = false;
          // Reload the user list to ensure data consistency
          this.loadUsers();
        },        error: (error) => {
          console.error('Error creating user:', error);
          this.error = error.error?.message || 'Erreur lors de la création de l\'utilisateur. Veuillez réessayer.';
          this.loading = false;
        }
      });
    }
  }

  editUser(user: UserDto): void {
    this.selectedUser = user;
    this.showEditForm = true;
    this.showCreateForm = false;
    
    this.editUserForm.patchValue({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  }

  hideEditForm(): void {
    this.showEditForm = false;
    this.selectedUser = null;
    this.editUserForm.reset();
  }  updateUser(): void {
    if (this.editUserForm.valid && this.selectedUser) {
      this.loading = true;
      this.error = null;
      
      const formValues = this.editUserForm.value;
      console.log('Form values before update:', formValues);
      
      const updateRequest: UpdateUserRequest = {
        id: this.selectedUser.id,
        nom: formValues.nom,
        prenom: formValues.prenom,
        email: formValues.email,
        phone: formValues.phone,
        role: parseInt(formValues.role) // Ensure role is a number
      };
      
      console.log('Update request payload:', updateRequest);
      
      this.userService.updateUser(updateRequest).subscribe({
        next: (updatedUser) => {
          console.log('User updated successfully:', updatedUser);
          this.hideEditForm();
          this.loading = false;
          // Reload the user list to ensure data consistency
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.error = error.error?.message || 'Erreur lors de la mise à jour de l\'utilisateur. Veuillez réessayer.';
          this.loading = false;
        }
      });
    }
  }
  deleteUser(user: UserDto): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.prenom} ${user.nom}?`)) {
      this.loading = true;
      this.error = null;
      
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          console.log('User deleted successfully');
          this.loading = false;
          // Reload the user list to ensure data consistency
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.error = error.error?.message || 'Erreur lors de la suppression de l\'utilisateur. Veuillez réessayer.';
          this.loading = false;
        }
      });
    }
  }  getRoleLabel(roleValue: number): string {
    return getRoleDisplayName(roleValue);
  }

  canDeleteUser(user: UserDto): boolean {
    // If no current user loaded, don't show delete button
    if (!this.currentUser) {
      return false;
    }

    // Check if current user is trying to delete themselves and they are an admin
    const isCurrentUser = this.currentUser.id === user.id;
    const isCurrentUserAdmin = this.currentUser.role === Role.Admin;
    const isTargetUserAdmin = user.role === Role.Admin;

    // Prevent admin from deleting themselves
    if (isCurrentUser && isCurrentUserAdmin) {
      return false;
    }

    // Allow deletion in all other cases (for admin users)
    return true;
  }
}
