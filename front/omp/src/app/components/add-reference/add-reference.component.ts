import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { UserService, UserDto } from '../../services/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddPhaseBulletDialogComponent } from '../add-phase-bullet-dialog/add-phase-bullet-dialog.component';
import { ReferenceService } from '../../services/reference.service';
import { ReferenceUploadService } from '../../services/reference-upload.service';
import { ReferenceDocumentService } from '../../services/reference-document.service';
import { DisplayReferenceComponent } from '../display-reference/display-reference.component';
import { Role } from '../../models/role.enum';
import { CountriesService, Country } from '../../services/countries.service';

@Component({
  selector: 'app-add-reference',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, DisplayReferenceComponent],
  templateUrl: './add-reference.component.html',
  styleUrl: './add-reference.component.css'
})
export class AddReferenceComponent implements OnInit {
  @ViewChild(DisplayReferenceComponent) displayReferenceComponent?: DisplayReferenceComponent;
  
  referenceForm: FormGroup;
  selectedFile: File | null = null;
  fileName: string = '';
  fileUrl: string | null = null;
  isLoading = false;

  // Team member tracking
  teamMembers: { id: string; name: string; role: string; }[] = [];
  userControl = new FormControl('');
  roleControl = new FormControl('');
  allUsers: UserDto[] = [];
  filteredUsers: Observable<UserDto[]>;
  showUserDropdown: boolean = false;
  selectedUser: UserDto | null = null;
  showRoleInput = false;

  // Country suggestion tracking
  countryControl = new FormControl('');
  filteredCountries: Observable<string[]>;
  showCountryDropdown: boolean = false;

  // Services section
  expandedSections = {
    services: false
  };
  
  // Edit modes for services
  serviceEditModes: boolean[] = [];
  serviceExpandStates: boolean[] = [];

  // Countries data
  countries: Country[] = [];
  isLoadingCountries: boolean = false;
  countryOptions: string[] = [];

  // Offre options (same as nouveau-opportunite)
  offreOptions: string[] = ['e-ID', 'TMT', 'GPS', 'Architecture', 'FS', 'Private'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private referenceService: ReferenceService,
    private referenceUploadService: ReferenceUploadService,
    private referenceDocumentService: ReferenceDocumentService,
    private dialog: MatDialog,
    private countriesService: CountriesService
  ) {
    this.referenceForm = this.fb.group({
      id: [null],
      nom: ['', [Validators.required]],
      country: ['', [Validators.required]],
      offre: ['', [Validators.required]],
      client: ['', [Validators.required]],
      budget: [null, [Validators.required, Validators.min(0)]],
      dateDebut: [null, [Validators.required]],
      dateFin: [null, [Validators.required]],
      equipe: [{}], // Initialize as an empty object, not an array
      documentUrl: [null],
      description: ['', [Validators.required]],
      services: this.fb.array([])
    });

    this.filteredUsers = this.userControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterUsers(value || ''))
    );

    this.filteredCountries = this.countryControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCountries(value || ''))
    );
  }  // Helper method to filter users based on input
  private filterUsers(value: string): UserDto[] {
    const filterValue = value.toLowerCase();
    return this.allUsers.filter(user => 
      // Exclude admin users
      user.role !== Role.Admin && (
        `${user.prenom} ${user.nom}`.toLowerCase().includes(filterValue) ||
        `${user.nom} ${user.prenom}`.toLowerCase().includes(filterValue)
      )
    );
  }

  // Helper method to filter countries based on input
  private filterCountries(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countryOptions.filter(country => 
      country.toLowerCase().includes(filterValue)
    );
  }

  // Load users from service
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  // Load countries from service
  loadCountries(): void {
    this.isLoadingCountries = true;
    this.countriesService.getAllCountries().subscribe({
      next: (data) => {
        this.countries = data;
        this.countryOptions = data.map((country: Country) => country.name.common);
        this.isLoadingCountries = false;
      },
      error: (error) => {
        console.error('Error fetching countries:', error);
        this.isLoadingCountries = false;
      }
    });
  }

  // Helper getter for services array
  get servicesArray(): FormArray {
    return this.referenceForm.get('services') as FormArray;
  }

  // Toggle services section expansion
  toggleSection(section: string): void {
    this.expandedSections[section as keyof typeof this.expandedSections] = 
      !this.expandedSections[section as keyof typeof this.expandedSections];
  }

  // Add new service category
  addServiceCategory(): void {
    const categoryGroup = this.fb.group({
      category: ['', Validators.required],
      subservices: this.fb.array([])
    });

    this.servicesArray.push(categoryGroup);
    this.ensureServiceArraysSize();
    this.serviceEditModes[this.servicesArray.length - 1] = true;
  }

  // Add subservice to a category
  addSubservice(categoryIndex: number, value: string = ''): void {
    if (this.hasEmptySubservice(categoryIndex)) return;
    
    const subservicesArray = this.getSubservicesArray(categoryIndex);
    subservicesArray.push(this.fb.control(value, Validators.required));
    
    this.ensureServiceArraysSize();
    this.serviceEditModes[categoryIndex] = true;
  }

  // Get subservices array for a category
  getSubservicesArray(categoryIndex: number): FormArray {
    return (this.servicesArray.at(categoryIndex) as FormGroup).get('subservices') as FormArray;
  }

  // Check for empty subservice in a category
  private hasEmptySubservice(categoryIndex: number): boolean {
    const subservicesArray = this.getSubservicesArray(categoryIndex);
    
    for (let i = 0; i < subservicesArray.length; i++) {
      const subservice = subservicesArray.at(i).value;
      if (!subservice || subservice.trim() === '') {
        return true;
      }
    }
    return false;
  }

  // Remove a subservice
  removeSubservice(categoryIndex: number, subserviceIndex: number): void {
    const subservicesArray = this.getSubservicesArray(categoryIndex);
    subservicesArray.removeAt(subserviceIndex);
  }

  // Remove a service category
  removeServiceCategory(index: number): void {
    this.servicesArray.removeAt(index);
    this.serviceEditModes.splice(index, 1);
    this.serviceExpandStates.splice(index, 1);
    
    // Auto-save the changes after deletion
    this.submitAndRefreshDisplay();
  }

  // Ensure arrays for tracking service states are the right size
  ensureServiceArraysSize(): void {
    const serviceCount = this.servicesArray.length;
    
    while (this.serviceEditModes.length < serviceCount) {
      this.serviceEditModes.push(true);
    }
    this.serviceEditModes = this.serviceEditModes.slice(0, serviceCount);
    
    while (this.serviceExpandStates.length < serviceCount) {
      this.serviceExpandStates.push(false);
    }
    this.serviceExpandStates = this.serviceExpandStates.slice(0, serviceCount);
  }

  // Toggle service category edit mode
  toggleServiceEditMode(index: number): void {
    this.ensureServiceArraysSize();
    this.serviceEditModes[index] = !this.serviceEditModes[index];
  }

  // Toggle service category expand state
  toggleServiceExpand(index: number, event: Event): void {
    event.stopPropagation();
    this.ensureServiceArraysSize();
    this.serviceExpandStates[index] = !this.serviceExpandStates[index];
  }

  // Handle blur event for service category
  onServiceBlur(index: number): void {
    const categoryGroup = this.servicesArray.at(index) as FormGroup;
    const subservicesArray = this.getSubservicesArray(index);
    
    if (categoryGroup.get('category')?.valid && subservicesArray.length > 0) {
      let hasValidSubservice = false;
      for (let i = 0; i < subservicesArray.length; i++) {
        if (subservicesArray.at(i).value && subservicesArray.at(i).valid) {
          hasValidSubservice = true;
          break;
        }
      }
      
      const lastSubservice = subservicesArray.length > 0 ? 
        subservicesArray.at(subservicesArray.length - 1).value : null;
      
      if (hasValidSubservice && lastSubservice && lastSubservice.trim() !== '') {
        this.ensureServiceArraysSize();
        this.serviceEditModes[index] = false;
      }
    }
  }

  // Handle click outside service edit mode
  handleServiceClickOutside(serviceIndex: number): void {
    this.onServiceBlur(serviceIndex);
  }
  isNouveauMode = false;

  ngOnInit(): void {
    // Load users for team member selection
    this.loadUsers();

    // Load countries for country selection
    this.loadCountries();

    // Check current route to determine if we're in nouveau mode
    this.isNouveauMode = this.router.url.includes('/nouveau-reference');

    // Check if we're in edit mode (URL has a reference ID parameter)
    this.route.paramMap.subscribe(params => {
      const referenceId = params.get('id');
      if (referenceId) {
        this.loadReferenceDetails(referenceId);
      }
    });
  }

  // Load reference details for edit mode
  loadReferenceDetails(referenceId: string): void {
    this.isLoading = true;
    
    // First load users to ensure we have the user data
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        
        // Then load the reference
        this.referenceService.getReferenceById(referenceId).subscribe({
          next: (reference) => {
            // Reset form arrays first
            this.servicesArray.clear();
            this.teamMembers = [];
            
            // Handle equipe data - now a dictionary of user ID to role
            if (reference.equipe) {
              Object.entries(reference.equipe).forEach(([userId, role]) => {
                const user = this.allUsers.find(u => u.id === userId);
                if (user) {
                  const memberName = `${user.prenom} ${user.nom}`;
                  this.teamMembers.push({ id: userId, name: memberName, role });
                }
              });
            }

            // Format dates as YYYY-MM-DD for the date inputs
            const dateDebut = reference.dateDebut ? new Date(reference.dateDebut).toISOString().split('T')[0] : null;
            const dateFin = reference.dateFin ? new Date(reference.dateFin).toISOString().split('T')[0] : null;
            
            // Patch the main reference form with data
            this.referenceForm.patchValue({
              id: reference.id,
              nom: reference.nom,
              country: reference.country,
              offre: reference.offre,
              client: reference.client,
              budget: reference.budget,
              dateDebut: dateDebut,
              dateFin: dateFin,
              equipe: reference.equipe,
              documentUrl: reference.documentUrl,
              description: reference.description
            });

            // Also update the country control for the suggestion input
            if (reference.country) {
              this.countryControl.setValue(reference.country);
            }

            // Load file information if it exists
            if (reference.documentUrl) {
              this.fileUrl = reference.documentUrl;
              this.fileName = this.extractFileNameFromUrl(reference.documentUrl);
            }

            // Handle services
            if (reference.services) {
              Object.entries(reference.services).forEach(([category, subservices]) => {
                const categoryGroup = this.fb.group({
                  category: [category, Validators.required],
                  subservices: this.fb.array([])
                });                const subservicesArray = categoryGroup.get('subservices') as FormArray;
                Object.entries(subservices).forEach(([mainBullet, subBullets]) => {
                  // Add the main bullet
                  subservicesArray.push(this.fb.control(mainBullet, Validators.required));
                  // Add its sub-bullets with indentation
                  if (Array.isArray(subBullets) && subBullets.length > 0) {
                    subBullets.forEach(subBullet => {
                      subservicesArray.push(this.fb.control(`  • ${subBullet}`, Validators.required));
                    });
                  }
                });

                this.servicesArray.push(categoryGroup);
              });

              this.ensureServiceArraysSize();
            }

            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading reference:', error);
            this.isLoading = false;
            alert('Une erreur est survenue lors du chargement de la référence.');
          }
        });
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
        alert('Une erreur est survenue lors du chargement des utilisateurs.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 52428800) { // 50MB limit
        alert('Le fichier est trop volumineux. La taille maximale est de 50MB.');
        return;
      }
      
      this.selectedFile = file;
      this.isLoading = true;
      
      // Get the current reference ID if we're in edit mode
      const referenceId = this.referenceForm.get('id')?.value;
      
      // Upload the file using our ReferenceUploadService
      this.referenceUploadService.uploadReferenceDocument(file, referenceId)
        .subscribe({
          next: (result) => {
            console.log('Reference document uploaded successfully:', result);
            this.isLoading = false;
            
            // Store the file URL and name
            this.fileUrl = result.fileUrl;
            this.fileName = this.selectedFile?.name || '';
            this.referenceForm.patchValue({ documentUrl: result.fileUrl });
            
            // If this is a new reference, update the form with the new reference ID
            if (!referenceId && result.referenceId) {
              this.referenceForm.patchValue({ id: result.referenceId });
            }
          },
          error: (error) => {
            console.error('Error uploading reference document:', error);
            this.isLoading = false;
            this.selectedFile = null;
            alert('Une erreur est survenue lors du téléchargement du document. Veuillez réessayer.');
          }
        });
    }
  }

  removeFile(): void {
    // Get the current reference ID
    const referenceId = this.referenceForm.get('id')?.value;
    
    if (referenceId && this.fileName) {
      // Show loading state while deleting
      this.isLoading = true;
      
      // Encode the file name for URL safety
      const encodedFileName = encodeURIComponent(this.fileName);
      
      // Delete the file from storage
      this.referenceDocumentService.deleteDocument(referenceId, encodedFileName).subscribe({
        next: () => {
          console.log('File removed from storage successfully');
          
          // Update the reference to remove the document URL reference
          this.fileUrl = null;
          this.fileName = '';
          this.selectedFile = null;
          
          // Update the reference in the database to remove the document reference
          this.updateReferenceAfterFileRemoval(referenceId);
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error removing file:', error);
          
          // If the error is 404 (Not Found), assume the file is already deleted
          if (error.status === 404) {
            console.log('File not found in storage, clearing UI references');
            this.updateReferenceAfterFileRemoval(referenceId);
          }
          
          // Still clear the UI even if backend delete fails
          this.fileUrl = null;
          this.fileName = '';
          this.selectedFile = null;
          this.isLoading = false;
        }
      });
    } else {
      // Just clear the file from the UI if it's not yet saved
      this.selectedFile = null;
      this.fileUrl = null;
      this.fileName = '';
      this.referenceForm.patchValue({ documentUrl: '' });
    }
  }

  // Helper method to update the reference after file removal
  private updateReferenceAfterFileRemoval(referenceId: string): void {
    const referenceData = { ...this.referenceForm.value };
    referenceData.documentUrl = null;
    
    this.referenceService.updateReference(referenceId, referenceData).subscribe({
      next: (response) => {
        console.log('Reference updated after file removal:', response);
      },
      error: (error) => {
        console.error('Error updating reference after file removal:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.referenceForm.valid) {
      this.isLoading = true;
      const formValue = this.referenceForm.value;
      const now = new Date();
      
      // Convert dates to UTC Date objects and ensure they're at midnight UTC
      const rawDateDebut = formValue.dateDebut ? new Date(formValue.dateDebut) : new Date();
      const rawDateFin = formValue.dateFin ? new Date(formValue.dateFin) : new Date();
      
      const dateDebut = new Date(Date.UTC(
        rawDateDebut.getFullYear(),
        rawDateDebut.getMonth(),
        rawDateDebut.getDate()
      ));
      
      const dateFin = new Date(Date.UTC(
        rawDateFin.getFullYear(),
        rawDateFin.getMonth(),
        rawDateFin.getDate()
      ));

      // Convert team members array to équipe dictionary
      const equipe: { [key: string]: string } = {};
      this.teamMembers.forEach(m => {
        equipe[m.id] = m.role;
      });

      // Create a new object with the correct types
      const referenceData = {
        id: formValue.id || undefined,
        nom: formValue.nom || '',
        country: formValue.country || '',
        offre: formValue.offre || '',
        client: formValue.client || '',
        budget: formValue.budget ? Number(formValue.budget) : 0,
        dateDebut: dateDebut,
        dateFin: dateFin,
        equipe: equipe,
        description: formValue.description || '',
        documentUrl: formValue.documentUrl || '',
        services: {} as { [key: string]: { [key: string]: string[] } },
        lastModified: now,
        lastAccessed: now
      };

      // Transform the services data
      if (this.servicesArray.controls.length > 0) {
        const transformedServices: { [key: string]: { [key: string]: string[] } } = {};
        
        this.servicesArray.controls.forEach((serviceGroup: any) => {
          const phase = serviceGroup.get('category')?.value;
          const subservices = serviceGroup.get('subservices')?.value;
          if (phase && Array.isArray(subservices)) {
            transformedServices[phase] = {};
            let currentMainBullet: string | null = null;
            
            subservices.forEach((subservice: string) => {
              if (!subservice.startsWith('  •')) {
                currentMainBullet = subservice.trim();
                transformedServices[phase][currentMainBullet] = [];
              } else if (currentMainBullet) {
                const cleanSubBullet = subservice.replace('  • ', '').trim();
                transformedServices[phase][currentMainBullet].push(cleanSubBullet);
              }
            });
          }
        });
        
        referenceData.services = transformedServices;
      }
      
      const urlId = this.route.snapshot.paramMap.get('id');
      
      if (urlId) {
        // Update existing reference
        this.referenceService.updateReference(urlId, referenceData).subscribe({
          next: (response) => {
            console.log('Reference updated successfully:', response);
            this.isLoading = false;
            
            // Refresh the display component after successful update
            if (this.displayReferenceComponent) {
              this.displayReferenceComponent.refreshData();
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating reference:', error);
            let errorMessage = 'Une erreur est survenue lors de la mise à jour de la référence.';
            if (error.error?.errors) {
              errorMessage += '\n' + Object.values(error.error.errors).join('\n');
            }
            alert(errorMessage);
          }
        });
      } else {
        // For create, remove the id field since it's undefined
        const { id, ...createData } = referenceData;
        // Create new reference
        this.referenceService.createReference(createData).subscribe({
          next: (response) => {
            console.log('Reference created successfully:', response);
            this.isLoading = false;
            
            if (response && response.id) {
              // Full refresh of form data for the newly created reference
              this.loadReferenceDetails(response.id);
              
              // Refresh the display component after loading
              setTimeout(() => {
                if (this.displayReferenceComponent) {
                  this.displayReferenceComponent.refreshData();
                }
              }, 500);
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating reference:', error);
            let errorMessage = 'Une erreur est survenue lors de la création de la référence.';
            if (error.error?.errors) {
              errorMessage += '\n' + Object.values(error.error.errors).join('\n');
            }
            alert(errorMessage);
          }
        });
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.referenceForm.controls).forEach(key => {
        const control = this.referenceForm.get(key);
        control?.markAsTouched();
      });
      
      alert('Veuillez remplir tous les champs obligatoires correctement.');
    }
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper method to extract filename from URL
  private extractFileNameFromUrl(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    const fullName = parts[parts.length - 1];
    
    // Handle URL-encoded characters and query parameters
    const queryParamIndex = fullName.indexOf('?');
    return queryParamIndex > 0 
      ? decodeURIComponent(fullName.substring(0, queryParamIndex))
      : decodeURIComponent(fullName);
  }
    // User suggestion methods
  showUserSuggestions(): void {
    this.showUserDropdown = true;
  }

  hideUserSuggestions(): void {
    // Small delay to allow click events to fire before hiding
    setTimeout(() => {
      this.showUserDropdown = false;
    }, 200);
  }

  // Country suggestion methods
  showCountrySuggestions(): void {
    this.showCountryDropdown = true;
  }

  hideCountrySuggestions(): void {
    // Small delay to allow click events to fire before hiding
    setTimeout(() => {
      this.showCountryDropdown = false;
    }, 200);
  }

  selectCountry(country: string): void {
    this.countryControl.setValue(country);
    this.referenceForm.patchValue({ country: country });
    this.showCountryDropdown = false;
    // Focus back to the input after selection
    setTimeout(() => {
      const countryInput = document.getElementById('country') as HTMLInputElement;
      if (countryInput) {
        countryInput.blur();
      }
    }, 0);
  }

  // Team member management methods
  selectUser(user: UserDto): void {
    this.selectedUser = user;
    this.userControl.setValue(`${user.prenom} ${user.nom}`);
    this.showUserDropdown = false;
    this.showRoleInput = true;
  }

  // Add a team member with role
  addTeamMember(): void {
    if (!this.selectedUser || !this.roleControl.value) return;
    
    const role = this.roleControl.value.trim();
    if (!role) {
      alert('Veuillez saisir un rôle pour le membre de l\'équipe');
      return;
    }
    
    // Remove existing member if already present
    const existingIndex = this.teamMembers.findIndex(m => m.id === this.selectedUser!.id);
    if (existingIndex !== -1) {
      this.teamMembers.splice(existingIndex, 1);
    }

    const memberName = `${this.selectedUser.prenom} ${this.selectedUser.nom}`;
    this.teamMembers.push({ 
      id: this.selectedUser.id, 
      name: memberName, 
      role 
    });
    
    // Convert team members array to equipe dictionary
    const equipe: { [key: string]: string } = {};
    this.teamMembers.forEach(m => {
      equipe[m.id] = m.role;
    });
    
    // Update the form with the equipe dictionary
    this.referenceForm.patchValue({ equipe });
    
    // Reset inputs
    this.userControl.setValue('');
    this.roleControl.setValue('');
    this.selectedUser = null;
    this.showRoleInput = false;
  }

  // Cancel team member selection
  cancelTeamMemberSelection(): void {
    // Reset all selection states
    this.userControl.setValue('');
    this.roleControl.setValue('');
    this.selectedUser = null;
    this.showRoleInput = false;
    this.showUserDropdown = false;
  }

  // Remove a team member
  removeTeamMember(memberId: string): void {
    const index = this.teamMembers.findIndex(m => m.id === memberId);
    if (index > -1) {
      this.teamMembers.splice(index, 1);
      
      // Convert remaining team members array to equipe dictionary
      const equipe: { [key: string]: string } = {};
      this.teamMembers.forEach(m => {
        equipe[m.id] = m.role;
      });
      
      // Update the form with the equipe dictionary
      this.referenceForm.patchValue({ equipe });
    }
  }

  // Handle keydown in role input
  handleRoleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTeamMember();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTeamMemberSelection();
    }
  }

  // Handle keydown in user input
  handleUserKeydown(event: KeyboardEvent): void {
    // If Enter key is pressed
    if (event.key === 'Enter' && !this.showRoleInput) {
      event.preventDefault();
      
      const inputValue = this.userControl.value?.trim();
      if (inputValue && !this.selectedUser) {
        // First check if there's a matching user
        const matchingUser = this.allUsers.find(user => 
          `${user.prenom} ${user.nom}`.toLowerCase().includes(inputValue.toLowerCase()) ||
          `${user.nom} ${user.prenom}`.toLowerCase().includes(inputValue.toLowerCase())
        );

        if (matchingUser) {
          this.selectUser(matchingUser);
        }
      }
    }
  }

  // Handle keydown in country input
  handleCountryKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      const inputValue = this.countryControl.value?.trim();
      if (inputValue) {
        // Check if there's an exact match or close match
        const exactMatch = this.countryOptions.find(country => 
          country.toLowerCase() === inputValue.toLowerCase()
        );
        
        const closeMatch = this.countryOptions.find(country => 
          country.toLowerCase().includes(inputValue.toLowerCase())
        );

        if (exactMatch) {
          this.selectCountry(exactMatch);
        } else if (closeMatch) {
          this.selectCountry(closeMatch);
        }
      }
    }
  }
  /**
   * Download the current file
   */
  downloadFile(): void {
    if (this.fileUrl && this.fileName) {
      this.referenceDocumentService.downloadDocument(this.fileUrl, this.fileName).subscribe({
        next: (blob: Blob) => {
          // Create a temporary URL for the blob
          const url = window.URL.createObjectURL(blob);
          
          // Create a link element and trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = this.fileName;
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        error: (err: Error) => {
          console.error('Error downloading file:', err);
          alert('Une erreur est survenue lors du téléchargement du fichier.');
        }
      });
    }
  }
  /**
   * Handle file input trigger for the "Change file" button
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('referenceFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Open bullets dialog for services
   * @param index Optional index of the service to edit
   */
  openBulletsDialog(index?: number): void {
    // First, determine if we're loading existing data or creating new
    const existingData = index !== undefined ? {
      phaseName: this.servicesArray.at(index).get('category')?.value,
      bullets: this.groupBulletsWithSubBullets(this.getSubservicesArray(index).controls.map(control => control.value))
    } : null;

    const dialogRef = this.dialog.open(AddPhaseBulletDialogComponent, {
      width: '600px',
      data: existingData
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        let wasChanged = false;
        if (index !== undefined) {
          // Update existing service
          const serviceGroup = this.servicesArray.at(index) as FormGroup;
          const subservicesArray = this.getSubservicesArray(index);
          
          serviceGroup.patchValue({ category: result.phaseName });
          subservicesArray.clear();
          
          // Track that changes were made
          wasChanged = true;
          
          // Add bullet points and their sub-bullets as subservices
          result.bullets.forEach((bullet: { text: string; subBullets: string[] }) => {
            // Add the main bullet
            subservicesArray.push(this.fb.control(bullet.text));
            
            // Add any sub-bullets with indentation
            if (bullet.subBullets && bullet.subBullets.length > 0) {
              bullet.subBullets.forEach(subBullet => {
                subservicesArray.push(this.fb.control(`  • ${subBullet}`));
              });
            }
          });
        } else {
          // Add new service
          const newServiceGroup = this.fb.group({
            category: [result.phaseName, Validators.required],
            subservices: this.fb.array([])
          });

          // Add bullet points and their sub-bullets as subservices
          const subservicesArray = newServiceGroup.get('subservices') as FormArray;
          result.bullets.forEach((bullet: { text: string; subBullets: string[] }) => {
            // Add the main bullet
            subservicesArray.push(this.fb.control(bullet.text));
            
            // Add any sub-bullets with indentation
            if (bullet.subBullets && bullet.subBullets.length > 0) {
              bullet.subBullets.forEach(subBullet => {
                // Add indentation to sub-bullets for visual hierarchy
                subservicesArray.push(this.fb.control(`  • ${subBullet}`));
              });
            }
          });

          // Add the new service group to the services array
          this.servicesArray.push(newServiceGroup);
          this.ensureServiceArraysSize();
          wasChanged = true;
        }
        
        // If changes were made, submit the form
        if (wasChanged) {
          this.submitAndRefreshDisplay();
        }
      }
    });
  }

  // Helper method to group bullets with their sub-bullets
  private groupBulletsWithSubBullets(services: string[]): { text: string; subBullets: string[] }[] {
    const bullets: { text: string; subBullets: string[] }[] = [];
    let currentBullet: { text: string; subBullets: string[] } | null = null;

    services.forEach(service => {
      if (!service.startsWith('  •')) {
        // This is a main bullet
        if (currentBullet) {
          bullets.push(currentBullet);
        }
        currentBullet = { text: service, subBullets: [] };
      } else {
        // This is a sub-bullet
        if (currentBullet) {
          currentBullet.subBullets.push(service.replace('  • ', ''));
        }
      }
    });

    // Don't forget to add the last bullet group
    if (currentBullet) {
      bullets.push(currentBullet);
    }

    return bullets;
  }

  // Method to submit form and refresh display component after successful save
  private submitAndRefreshDisplay(): void {
    if (this.referenceForm.valid) {
      this.isLoading = true;
      const formValue = this.referenceForm.value;
      const now = new Date();
      
      // Convert dates to UTC Date objects and ensure they're at midnight UTC
      const rawDateDebut = formValue.dateDebut ? new Date(formValue.dateDebut) : new Date();
      const rawDateFin = formValue.dateFin ? new Date(formValue.dateFin) : new Date();
      
      const dateDebut = new Date(Date.UTC(
        rawDateDebut.getFullYear(),
        rawDateDebut.getMonth(),
        rawDateDebut.getDate()
      ));
      
      const dateFin = new Date(Date.UTC(
        rawDateFin.getFullYear(),
        rawDateFin.getMonth(),
        rawDateFin.getDate()
      ));

      // Convert team members array to équipe dictionary
      const equipe: { [key: string]: string } = {};
      this.teamMembers.forEach(m => {
        equipe[m.id] = m.role;
      });

      // Create a new object with the correct types
      const referenceData = {
        id: formValue.id || undefined,
        nom: formValue.nom || '',
        country: formValue.country || '',
        offre: formValue.offre || '',
        client: formValue.client || '',
        budget: formValue.budget ? Number(formValue.budget) : 0,
        dateDebut: dateDebut,
        dateFin: dateFin,
        equipe: equipe,
        description: formValue.description || '',
        documentUrl: formValue.documentUrl || '',
        services: {} as { [key: string]: { [key: string]: string[] } },
        lastModified: now,
        lastAccessed: now
      };

      // Transform the services data
      if (this.servicesArray.controls.length > 0) {
        const transformedServices: { [key: string]: { [key: string]: string[] } } = {};
        
        this.servicesArray.controls.forEach((serviceGroup: any) => {
          const phase = serviceGroup.get('category')?.value;
          const subservices = serviceGroup.get('subservices')?.value;
          if (phase && Array.isArray(subservices)) {
            transformedServices[phase] = {};
            let currentMainBullet: string | null = null;
            
            subservices.forEach((subservice: string) => {
              if (!subservice.startsWith('  •')) {
                currentMainBullet = subservice.trim();
                transformedServices[phase][currentMainBullet] = [];
              } else if (currentMainBullet) {
                const cleanSubBullet = subservice.replace('  • ', '').trim();
                transformedServices[phase][currentMainBullet].push(cleanSubBullet);
              }
            });
          }
        });
        
        referenceData.services = transformedServices;
      }
      
      const urlId = this.route.snapshot.paramMap.get('id');
      
      if (urlId) {
        // Update existing reference
        this.referenceService.updateReference(urlId, referenceData).subscribe({
          next: (response) => {
            console.log('Reference updated successfully:', response);
            this.isLoading = false;
            
            // Refresh the display component after successful update
            if (this.displayReferenceComponent) {
              this.displayReferenceComponent.refreshData();
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating reference:', error);
            let errorMessage = 'Une erreur est survenue lors de la mise à jour de la référence.';
            if (error.error?.errors) {
              errorMessage += '\n' + Object.values(error.error.errors).join('\n');
            }
            alert(errorMessage);
          }
        });
      } else {
        // For create, remove the id field since it's undefined
        const { id, ...createData } = referenceData;
        // Create new reference
        this.referenceService.createReference(createData).subscribe({
          next: (response) => {
            console.log('Reference created successfully:', response);
            this.isLoading = false;
            
            if (response && response.id) {
              // Full refresh of form data for the newly created reference
              this.loadReferenceDetails(response.id);
              
              // Refresh the display component after loading
              setTimeout(() => {
                if (this.displayReferenceComponent) {
                  this.displayReferenceComponent.refreshData();
                }
              }, 500);
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating reference:', error);
            let errorMessage = 'Une erreur est survenue lors de la création de la référence.';
            if (error.error?.errors) {
              errorMessage += '\n' + Object.values(error.error.errors).join('\n');
            }
            alert(errorMessage);
          }
        });
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.referenceForm.controls).forEach(key => {
        const control = this.referenceForm.get(key);
        control?.markAsTouched();
      });
      
      alert('Veuillez remplir tous les champs obligatoires correctement.');
    }
  }
}
