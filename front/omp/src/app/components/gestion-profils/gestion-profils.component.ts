import { Component, OnInit, Output, EventEmitter, Input, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Observable, forkJoin, of, firstValueFrom, Subject, fromEvent } from 'rxjs';
import { map, startWith, catchError, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { UserService, UserDto } from '../../services/user.service';
import { OpportuniteDto } from '../../services/opportunite.service';
import { PartenaireService, PartenaireDto } from '../../services/partenaire.service';
import { ProfilService } from '../../services/profil.service';
import { PropositionFinanciereService } from '../../services/proposition-financiere.service';
import { ProfilDto } from '../../models/profil.interface';
import { PropositionFinanciereDto } from '../../models/proposition-financiere.interface';

interface Profile {
  id: number;
  name: string;
  nomPrenom?: string;
  poste?: string;
  tjm?: number;
  entite?: string;
  userId?: string;
  dbId?: string; // Add database ID field
}

@Component({
  selector: 'app-gestion-profils',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [UserService, PartenaireService],
  templateUrl: './gestion-profils.component.html',
  styleUrls: ['./gestion-profils.component.css']
})
export class GestionProfilsComponent implements OnInit {
  @Output() profilesChanged = new EventEmitter<void>();
  @Output() propositionFinanciereCreated = new EventEmitter<string>(); // Add this output

  @Input() propositionName: string = ''; // Input pour recevoir le nom de la proposition

  @Input() set linkedOpportunityProfiles(profiles: Profile[]) {
    if (profiles && profiles.length > 0) {
      this.profiles = [...profiles];
      this.profilesChanged.emit();
    }
  }
  @Input() set opportunityData(data: OpportuniteDto | null) {
    if (data) {
      console.log('[GestionProfils] Received opportunity data:', data);
      this.currentOpportunity = data;      // Store associe, manager, co-manager and senior manager IDs
      this.associeEnChargeId = data.associeEnCharge;
      this.managerEnChargeId = data.managerEnCharge;
      this.coManagerEnChargeId = data.coManagerEnCharge;
      this.seniorManagerEnChargeId = data.seniorManagerEnCharge;
      if (data.partenaireId && data.partenaireId.length > 0) {
        console.log('[GestionProfils] Loading partners:', data.partenaireId);
        this.loadPartnerNames(data.partenaireId);
      } else {
        console.log('[GestionProfils] No partners to load');
        this.updateEntityOptions([]);
      }
      this.updateFilteredUsers();
    }
  }

  profiles: Profile[] = [];
  newProfile: Profile = { id: 0, name: '', nomPrenom: '', poste: '', tjm: 0, entite: '' };
  showAddProfileForm: boolean = false;
  nextProfileId: number = 1;
  selectedUser: UserDto | null = null;
  currentOpportunity: OpportuniteDto | null = null;

  // Custom autocomplete properties
  showUserDropdown: boolean = false;
  showEntityDropdown: boolean = false;
  userSearchInput: string = '';
  entitySearchInput: string = '';
  
  entiteControl = new FormControl('');
  entiteOptions: string[] = ['EY'];
  filteredOptions: Observable<string[]>;
  filteredEntities: string[] = [];

  userControl = new FormControl('');
  allUsers: UserDto[] = [];
  filteredUsers: Observable<UserDto[]>;

  displayedColumns: string[] = ['nomPrenom', 'poste', 'entite', 'tjm', 'actions'];  // Add new properties to track associe, manager and co-manager
  associeEnChargeId: string | undefined;
  managerEnChargeId: string | undefined;
  coManagerEnChargeId: string | undefined;
  seniorManagerEnChargeId: string | undefined;

  // Add property to track the current proposition financiere ID
  currentPropositionFinanciereId: string | null = null;
  isCreatingProfile: boolean = false;
  isLoadingProfiles: boolean = false; // Add flag to track loading state

  constructor(
    private userService: UserService,
    private partenaireService: PartenaireService,
    private profilService: ProfilService,
    private propositionFinanciereService: PropositionFinanciereService
  ) {
    this.filteredOptions = this.entiteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );

    this.filteredUsers = this.userControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterUsers(value || '')),
    );
  }

  // Add references to input elements for custom dropdowns
  @ViewChild('userSearchInput') userSearchElement!: ElementRef;
  @ViewChild('entitySearchInput') entitySearchElement!: ElementRef;

  // Handle closing dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Close user dropdown if clicking outside of it
    if (this.showUserDropdown && !target.closest('.custom-input-container')) {
      this.showUserDropdown = false;
    }
    
    // Close entity dropdown if clicking outside of it
    if (this.showEntityDropdown && !target.closest('.custom-input-container')) {
      this.showEntityDropdown = false;
    }
  }
  ngOnInit() {
    this.loadUsers();
    // Initialize filteredEntities with default options
    this.filteredEntities = this.entiteOptions;
  }

  /**
   * Set a proposition financière ID and load associated profiles
   */
  @Input() set propositionFinanciereId(id: string | null) {
    if (id) {
      this.currentPropositionFinanciereId = id;
      this.loadProfilesFromDatabase();
    }
  }

  /**
   * Load profiles from database for the current proposition financière
   */
  loadProfilesFromDatabase() {
    if (!this.currentPropositionFinanciereId) {
      console.log('[GestionProfils] No proposition financière ID to load profiles for');
      return;
    }

    this.isLoadingProfiles = true;
    console.log('[GestionProfils] Loading profiles for proposition financière:', this.currentPropositionFinanciereId);
    
    this.profilService.getProfilsByPropositionFinanciere(this.currentPropositionFinanciereId)
      .subscribe({
        next: (dbProfiles) => {
          console.log('[GestionProfils] Loaded profiles from database:', dbProfiles);
          
          // Clear existing profiles
          this.profiles = [];
          
          // Convert DB profiles to local Profile format
          if (dbProfiles && dbProfiles.length > 0) {
            // Get partner information for profiles
            this.loadPartnerInfoForProfiles(dbProfiles);
          } else {
            this.isLoadingProfiles = false;
          }
        },
        error: (error) => {
          console.error('[GestionProfils] Error loading profiles:', error);
          this.isLoadingProfiles = false;
        }
      });
  }

  /**
   * Load partner information for profiles
   */
  private loadPartnerInfoForProfiles(dbProfiles: ProfilDto[]) {
    // Collect unique partner IDs
    const partnerIds = Array.from(new Set(
      dbProfiles
        .filter(p => p.idPartenaire)
        .map(p => p.idPartenaire as string)
    ));
    
    if (partnerIds.length > 0) {
      // Load all partners in one go
      const partnerObservables = partnerIds.map(id => 
        this.partenaireService.getPartenaireById(id).pipe(
          catchError(error => {
            console.error(`[GestionProfils] Error loading partner ${id}:`, error);
            return of(null);
          })
        )
      );
      
      forkJoin(partnerObservables).subscribe({
        next: (partners) => {
          // Create a map of partner ID to partner name
          const partnerMap = new Map<string, string>();
          partners.filter((p): p is PartenaireDto => p !== null)
            .forEach(p => {
              if (p.id && p.nom) {
                partnerMap.set(p.id, p.nom);
              }
            });
          
          // Now add the profiles with partner names
          this.addProfilesWithPartnerInfo(dbProfiles, partnerMap);
          this.isLoadingProfiles = false;
        },
        error: (error) => {
          console.error('[GestionProfils] Error loading partner information:', error);
          // Fall back to adding profiles without partner names
          this.addProfilesWithPartnerInfo(dbProfiles, new Map<string, string>());
          this.isLoadingProfiles = false;
        }
      });
    } else {
      // No partners to load, just add the profiles
      this.addProfilesWithPartnerInfo(dbProfiles, new Map<string, string>());
      this.isLoadingProfiles = false;
    }
  }

  /**
   * Add profiles with partner information
   */
  private addProfilesWithPartnerInfo(dbProfiles: ProfilDto[], partnerMap: Map<string, string>) {
    // Reset the next profile ID
    this.nextProfileId = 1;
    
    // Sort the dbProfiles by numero before adding them
    const sortedProfiles = [...dbProfiles].sort((a, b) => {
      // Handle null or undefined numero values by placing them at the end
      if (a.numero === undefined || a.numero === null) return 1;
      if (b.numero === undefined || b.numero === null) return -1;
      return a.numero - b.numero;
    });
    
    // Add profiles
    sortedProfiles.forEach(dbProfile => {
      // If idPartenaire is null or the partner isn't found in the map, use "EY" as the entity
      const entite = dbProfile.idPartenaire 
        ? partnerMap.get(dbProfile.idPartenaire) || 'EY'
        : 'EY';
        
      const profile: Profile = {
        id: this.nextProfileId++,
        name: `${dbProfile.poste || ''} - ${dbProfile.nomPrenom || ''}`,
        nomPrenom: dbProfile.nomPrenom || '',
        poste: dbProfile.poste || '',
        tjm: dbProfile.tjm || 0,
        entite: entite,
        dbId: dbProfile.id // Store the database ID
      };
      
      this.profiles.push(profile);
    });
    
    // Update filtered users to exclude existing profiles
    this.updateFilteredUsers();
    
    // Notify parent component
    this.profilesChanged.emit();
  }

  private loadPartnerNames(partnerIds: string[]) {
    console.log('[GestionProfils] Starting to load partner names for IDs:', partnerIds);
    const partnerObservables = partnerIds.map(id => 
      this.partenaireService.getPartenaireById(id).pipe(
        catchError((error) => {
          console.error('[GestionProfils] Error loading partner:', id, error);
          return of(null);
        })
      )
    );

    forkJoin(partnerObservables).subscribe({
      next: (partners) => {
        const validPartners = partners.filter((p): p is PartenaireDto => p !== null);
        console.log('[GestionProfils] Loaded partners:', validPartners);
        this.updateEntityOptions(validPartners);
      },
      error: (error) => {
        console.error('[GestionProfils] Error loading partners:', error);
        this.updateEntityOptions([]);
      }
    });
  }
  private updateEntityOptions(partners: PartenaireDto[]) {
    // Reset to default option
    this.entiteOptions = ['EY'];
    // Add partner names from opportunity
    partners.forEach(partner => {
      if (partner.nom && !this.entiteOptions.includes(partner.nom)) {
        console.log('[GestionProfils] Adding partner to options:', partner.nom);
        this.entiteOptions.push(partner.nom);
      }
    });
    console.log('[GestionProfils] Updated entity options:', this.entiteOptions);
    
    // Update filtered entities for custom dropdown
    this.filteredEntities = this.entiteOptions;
    
    // Force update of autocomplete options
    this.filteredOptions = this.entiteControl.valueChanges.pipe(
      startWith(this.entiteControl.value),
      map(value => this._filter(value || '')),
    );
  }

  private _filter(value: string): string[] {
    if (!value) return this.entiteOptions;
    
    const filterValue = value.toLowerCase();
    const filteredOptions = this.entiteOptions.filter(option => 
      option.toLowerCase().includes(filterValue)
    );
    
    // Allow custom values if they don't exist in the list
    if (!filteredOptions.includes(value) && value.trim() !== '') {
      return [value, ...filteredOptions];
    }
    
    return filteredOptions;
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.updateFilteredUsers();
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }
  private _filterUsers(value: string): UserDto[] {
    const filterValue = value.toLowerCase();
    
    // Filter out users that are already added as profiles
    const availableUsers = this.allUsers.filter(user => {
      const fullName = `${user.prenom} ${user.nom}`;
      return !this.profiles.some(profile => profile.nomPrenom === fullName);
    });
      // Sort users - associe en charge, manager en charge, co-manager en charge, senior manager en charge first, then team members, then others
    return availableUsers
      .sort((a, b) => {
        const aIsAssocie = a.id === this.associeEnChargeId;
        const bIsAssocie = b.id === this.associeEnChargeId;
        const aIsManager = a.id === this.managerEnChargeId;
        const bIsManager = b.id === this.managerEnChargeId;
        const aIsCoManager = a.id === this.coManagerEnChargeId;
        const bIsCoManager = b.id === this.coManagerEnChargeId;
        const aIsSeniorManager = a.id === this.seniorManagerEnChargeId;
        const bIsSeniorManager = b.id === this.seniorManagerEnChargeId;
        const aInTeam = this.currentOpportunity?.equipeProjet?.includes(a.id) || false;
        const bInTeam = this.currentOpportunity?.equipeProjet?.includes(b.id) || false;

        if (aIsAssocie && !bIsAssocie) return -1;
        if (!aIsAssocie && bIsAssocie) return 1;
        if (aIsManager && !bIsManager) return -1;
        if (!aIsManager && bIsManager) return 1;
        if (aIsCoManager && !bIsCoManager) return -1;
        if (!aIsCoManager && bIsCoManager) return 1;
        if (aIsSeniorManager && !bIsSeniorManager) return -1;
        if (!aIsSeniorManager && bIsSeniorManager) return 1;
        if (aInTeam && !bInTeam) return -1;
        if (!aInTeam && bInTeam) return 1;
        return 0;
      })
      .filter(user => 
        `${user.prenom} ${user.nom}`.toLowerCase().includes(filterValue) ||
        `${user.nom} ${user.prenom}`.toLowerCase().includes(filterValue)
      );
  }

  toggleAddProfileForm() {
    this.showAddProfileForm = !this.showAddProfileForm;
    if (this.showAddProfileForm) {
      this.resetForm();
    }
  }

  private resetForm() {
    this.newProfile = { id: 0, name: '', nomPrenom: '', poste: '', tjm: 0, entite: '' };
    this.entiteControl.setValue('');
    this.userControl.setValue('');
  }

  displayUserFn(value: UserDto | string): string {
    if (typeof value === 'string') {
      return value;
    }
    return value ? `${value.prenom} ${value.nom}` : '';
  }

  onUserSelected(event: any) {
    if (event.option) {
      const selectedUser = event.option.value;
      if (selectedUser && typeof selectedUser !== 'string') {
        this.newProfile.nomPrenom = `${selectedUser.prenom} ${selectedUser.nom}`;
        this.newProfile.userId = selectedUser.id;
      }
    }
  }

  showUserSuggestions() {
    this.showUserDropdown = true;
    this.filterUsers(this.userControl.value);
  }

  showEntitySuggestions() {
    this.showEntityDropdown = true;
    this.filterEntities(this.entiteControl.value);
  }

  filterUsers(value: any) {
    const filteredUsers = this._filterUsers(value || '');
    this.filteredUsers = of(filteredUsers);
  }

  filterEntities(value: any) {
    this.filteredEntities = this._filter(value || '');
  }
  selectUser(user: UserDto) {
    this.userControl.setValue(`${user.prenom} ${user.nom}`);
    this.selectedUser = user;
    this.newProfile.nomPrenom = `${user.prenom} ${user.nom}`;
    this.newProfile.userId = user.id;
    this.showUserDropdown = false;
  }

  selectEntity(entity: string) {
    this.entiteControl.setValue(entity);
    this.showEntityDropdown = false;
  }

  async addProfile() {
    if (!this.userControl.value || !this.newProfile.poste || !this.newProfile.tjm || !this.entiteControl.value) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Prevent multiple submissions
    if (this.isCreatingProfile) return;
    this.isCreatingProfile = true;

    try {      // Handle the user selection
      if (!this.selectedUser || typeof this.selectedUser === 'string') {
        const inputValue = this.userControl.value;
        this.newProfile.nomPrenom = typeof inputValue === 'string' ? 
          inputValue : 
          (inputValue as UserDto)?.prenom + ' ' + (inputValue as UserDto)?.nom;
        this.newProfile.userId = undefined;
      }
      
      // Check if we need to create a proposition financière (if this is the first profile)
      if (!this.currentPropositionFinanciereId && this.profiles.length === 0) {
        console.log('[GestionProfils] Creating new empty proposition financière...');
        const propositionName = this.propositionName.trim() || 'Proposition sans nom';
        console.log('[GestionProfils] Using proposition name:', propositionName);
        
        const emptyProposition: Omit<PropositionFinanciereDto, 'id'> = {
          // Initialize with empty values
          nom: propositionName,
          profils: [],
          livrables: [],
          matricePL: [],
          matricePLSiege: [],
          matricePLTerrain: [],
          totalCost: 0,
          sumHJ: 0,
          nbrJoursParMois: 22 // Default value
        };

        try {
          const response = await firstValueFrom(this.propositionFinanciereService.createPropositionFinanciere(emptyProposition));
          // Handle string or object response
          if (typeof response === 'string') {
            this.currentPropositionFinanciereId = response;
          } else {
            this.currentPropositionFinanciereId = response.id;
          }
          console.log('[GestionProfils] Created proposition financière with ID:', this.currentPropositionFinanciereId);
          
          // Emit the proposition financiere ID to the parent component
          this.propositionFinanciereCreated.emit(this.currentPropositionFinanciereId);
        } catch (error) {
          console.error('[GestionProfils] Error creating proposition financière:', error);
          alert('Erreur lors de la création de la proposition financière');
          this.isCreatingProfile = false;
          return;
        }
      }

      // Handle entity/partner selection
      let partenaireId: string | undefined = undefined;
      const entityName = this.entiteControl.value || '';
      
      // Skip partner handling for EY
      if (entityName !== 'EY') {
        // First check if we already have a partner loaded for this entity name
        // This will handle the case of adding multiple profiles with the same partner
        const loadedPartner = await this.findPartnerByName(entityName);
        
        if (loadedPartner) {
          // Use the existing partner
          partenaireId = loadedPartner.id;
          console.log('[GestionProfils] Using existing partner:', entityName, 'with ID:', partenaireId);
        } 
        // If not found among loaded partners, check if we need to create a new one
        else if (!this.entiteOptions.includes(entityName)) {
          console.log('[GestionProfils] Creating new partenaire with name:', entityName);
          // Create new partenaire with only the name
          const newPartenaire: PartenaireDto = {
            id: '',
            nom: entityName
          };

          try {
            const response = await firstValueFrom(this.partenaireService.createPartenaire(newPartenaire));
            // Handle string or object response
            if (typeof response === 'string') {
              partenaireId = response;
            } else {
              partenaireId = response.id;
            }
            
            // Add to entiteOptions for future use
            this.entiteOptions.push(entityName);
            console.log('[GestionProfils] Created partenaire with ID:', partenaireId);
          } catch (error) {
            console.error('[GestionProfils] Error creating partenaire:', error);
            alert(`Erreur lors de la création du partenaire ${entityName}`);
            // Continue anyway, we'll create the profile without a partenaire ID
          }
        } else {
          // Entity is in options but we couldn't find it. This is unexpected.
          console.warn('[GestionProfils] Entity in options but not found in loaded partners:', entityName);
        }
      }

      // Calculate the profile number (sequential number starting from 1)
      const profileNumber = this.profiles.length + 1;

      // Now create the profile
      const profileDto: ProfilDto = {
        id: '', // Will be assigned by the server
        nomPrenom: this.newProfile.nomPrenom,
        poste: this.newProfile.poste,
        tjm: this.newProfile.tjm,
        idPropositionFinanciere: this.currentPropositionFinanciereId || undefined,
        idPartenaire: entityName !== 'EY' ? partenaireId : undefined,
        numero: profileNumber // Assign sequential number
      };

      console.log('[GestionProfils] Creating profile with data:', profileDto);

      try {
        const response = await firstValueFrom(this.profilService.createProfil(profileDto));
        // Handle string or object response
        let createdProfileId = '';
        if (typeof response === 'string') {
          createdProfileId = response;
        } else {
          createdProfileId = response.id;
        }
        console.log('[GestionProfils] Created profile with ID:', createdProfileId);

        // Add the profile to the local array
        const profile: Profile = {
          id: this.nextProfileId++,
          name: `${this.newProfile.poste} - ${this.newProfile.nomPrenom}`,
          nomPrenom: this.newProfile.nomPrenom,
          poste: this.newProfile.poste,
          tjm: this.newProfile.tjm,
          entite: this.entiteControl.value || 'EY',
          userId: this.newProfile.userId,
          dbId: createdProfileId // Store the database ID
        };
        
        this.profiles.push(profile);
        
        // Reset the form completely
        this.resetForm();
        
        // Force update of autocomplete
        this.updateFilteredUsers();
        
        // Emit the change event
        this.profilesChanged.emit();

      } catch (error) {
        console.error('[GestionProfils] Error creating profile:', error);
        alert('Erreur lors de la création du profil');
      }
    } finally {
      this.isCreatingProfile = false;
    }
  }

  async removeProfile(profileId: number) {
    const profileToRemove = this.profiles.find(p => p.id === profileId);
    if (!profileToRemove) return;
    
    try {
      // If we have the database ID directly stored in the profile
      if (profileToRemove.dbId) {
        console.log('[GestionProfils] Deleting profile with database ID:', profileToRemove.dbId);
        await firstValueFrom(this.profilService.deleteProfil(profileToRemove.dbId));
        console.log('[GestionProfils] Successfully deleted profile from database');
      } 
      // Fallback to searching by attributes if no dbId
      else if (this.currentPropositionFinanciereId) {
        console.log('[GestionProfils] No database ID found, searching for profile by attributes');
        // Get all profiles for this proposition financière
        const profiles = await firstValueFrom(
          this.profilService.getProfilsByPropositionFinanciere(this.currentPropositionFinanciereId)
        );
        
        // Find the matching profile by name, poste and TJM
        const dbProfile = profiles.find(p => 
          p.nomPrenom === profileToRemove.nomPrenom && 
          p.poste === profileToRemove.poste && 
          p.tjm === profileToRemove.tjm
        );
        
        if (dbProfile) {
          console.log('[GestionProfils] Found matching profile in database:', dbProfile);
          // Delete the profile from the database
          await firstValueFrom(this.profilService.deleteProfil(dbProfile.id));
          console.log('[GestionProfils] Successfully deleted profile from database with ID:', dbProfile.id);
        } else {
          console.warn('[GestionProfils] Could not find matching profile in database to delete');
        }
      } else {
        console.warn('[GestionProfils] Cannot delete profile from database - no proposition financière ID');
      }

      // Remove from local array
      this.profiles = this.profiles.filter(p => p.id !== profileId);
      
      // Update the numbering for all remaining profiles
      this.updateProfileNumbers();
      
      this.updateFilteredUsers();
      this.profilesChanged.emit();
      
    } catch (error) {
      console.error('[GestionProfils] Error deleting profile from database:', error);
      alert('Erreur lors de la suppression du profil. Vérifiez la console pour plus de détails.');
    }
  }

  updateProfile(profile: Profile) {
    const index = this.profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      this.profiles[index] = { ...profile };
      this.profilesChanged.emit();
    }
  }
  private updateFilteredUsers() {
    this.filteredUsers = this.userControl.valueChanges.pipe(
      startWith(this.userControl.value),
      map(value => this._filterUsers(value || '')),
    );
    
    // Also update the filtered entities list for the custom dropdown
    this.filteredEntities = this._filter(this.entiteControl.value || '');
  }
  resetFilters() {
    this.currentOpportunity = null;
    // Reset the user control and trigger a new filtering
    if (this.userControl) {
      this.userControl.setValue('');
    }
    // Reset entity options to default
    this.entiteOptions = ['EY'];
    this.entiteControl.setValue('');
    
    // Hide dropdowns
    this.showUserDropdown = false;
    this.showEntityDropdown = false;
    
    // Update entity autocomplete options
    this.filteredOptions = this.entiteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
    
    // Initialize filtered entities
    this.filteredEntities = this.entiteOptions;
    
    // Update filtered users with no opportunity context
    this.filteredUsers = this.userControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const filterValue = (value || '').toLowerCase();
        // Filter out users that are already added as profiles
        return this.allUsers.filter(user => {
          const fullName = `${user.prenom} ${user.nom}`;
          return !this.profiles.some(profile => profile.nomPrenom === fullName) &&
                 (fullName.toLowerCase().includes(filterValue) ||
                  `${user.nom} ${user.prenom}`.toLowerCase().includes(filterValue));
        });
      })
    );
  }

  private async findPartnerByName(name: string): Promise<PartenaireDto | undefined> {
    try {
      // Get all partners first
      const allPartners = await firstValueFrom(this.partenaireService.getPartenaires());
      
      // Then filter by name (case-insensitive)
      return allPartners.find(partner => 
        partner.nom?.toLowerCase() === name.toLowerCase()
      );
    } catch (error) {
      console.error('[GestionProfils] Error finding partner by name:', error);
      return undefined;
    }
  }

  /**
   * Updates the profile numbers to be sequential from 1 to n
   */
  private updateProfileNumbers() {
    // Sort profiles by ID to ensure consistent ordering
    const sortedProfiles = [...this.profiles].sort((a, b) => a.id - b.id);
    
    // Update database entries if we have a proposition financière ID
    if (this.currentPropositionFinanciereId) {
      sortedProfiles.forEach(async (profile, index) => {
        const numero = index + 1; // Assign sequential number starting from 1
        
        if (profile.dbId) {
          try {
            // Get the current profile data
            const currentProfile = await firstValueFrom(this.profilService.getProfilById(profile.dbId));
            if (currentProfile) {
              // Update the profile with the new numero
              currentProfile.numero = numero;
              await firstValueFrom(this.profilService.updateProfil(profile.dbId, currentProfile));
              console.log(`[GestionProfils] Updated profile ${profile.dbId} numero to ${numero}`);
            }
          } catch (error) {
            console.error(`[GestionProfils] Error updating profile ${profile.dbId} numero:`, error);
          }
        }
      });
    }
  }
}
