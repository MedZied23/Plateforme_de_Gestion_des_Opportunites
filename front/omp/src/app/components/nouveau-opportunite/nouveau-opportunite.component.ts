import { Component, OnInit, HostListener, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountriesService, Country } from '../../services/countries.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UserService, UserDto } from '../../services/user.service';
import { ClientService, ClientDto } from '../../services/client.service';
import { BailleurDeFondsService, BailleurDeFondDto } from '../../services/bailleur-fonds.service';
import { OpportuniteService, OpportuniteDto } from '../../services/opportunite.service';
import { OpportuniteDocumentService } from '../../services/opportunite-document.service';
import { PartenaireService, PartenaireDto, TypePartenaire } from '../../services/partenaire.service';
import { AnalysisResultsService, AnalysisResultsResponse } from '../../services/analysis-results.service';
import { PermissionService } from '../../services/permission.service';
import { DebugService } from '../../services/debug.service';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Role } from '../../models/role.enum';
import { Nature, getAllNatureOptions, getNatureDisplayNames, getNatureFromDisplayName } from '../../enums/nature.enum';

// Define interfaces to ensure type safety
interface Field {
  name: string;
  label: string;
  value: string;
  type?: string;
  options?: string[];
  readonly?: boolean;
  customValue?: string;
  showWhen?: { field: string, value: string };
  selectedValues?: string[]; // For multi-select fields
  userData?: UserDto[]; // To store the original user data
  selectedUserIds?: string[]; // To store selected user IDs for multi-select fields
  partenaireData?: PartenaireDto[]; // To store partenaire data
  selectedPartenaireIds?: string[]; // To store selected partenaire IDs
  partenaireDetails?: { [key: string]: PartenaireDto }; // Details for each partenaire
  fieldToUpdate?: string; // For targeting specific fields in partenaire form
}

interface Step {
  title: string;
  fields: Field[];
}

@Component({
  selector: 'app-nouveau-opportunite',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [OpportuniteDocumentService], // Add service to providers
  templateUrl: './nouveau-opportunite.component.html',
  styleUrls: ['./nouveau-opportunite.component.css']
})
export class NouveauOpportuniteComponent implements OnInit, OnDestroy {
  currentStep: number = 0;
  selectedFile: File | null = null;
  isDragOver: boolean = false;
  countries: Country[] = [];
  isLoadingCountries: boolean = false;  associeUsers: UserDto[] = [];
  managerUsers: UserDto[] = [];
  seniorManagerUsers: UserDto[] = []; // Users for senior manager field (Associé, Directeur, Senior Manager only)
  teamUsers: UserDto[] = []; // Add this property to store team members
  clients: ClientDto[] = []; // Add property to store clients
  isLoadingClients: boolean = false;
  bailleursDeFonds: BailleurDeFondDto[] = []; // Add property to store bailleurs de fonds
  isLoadingBailleursDeFonds: boolean = false;
  partenaires: PartenaireDto[] = []; // Add property to store partenaires
  isLoadingPartenaires: boolean = false;
  createdOpportuniteId: string | null = null; // Add property to store the ID of the opportunité created when a file is uploaded
  isFileUploaded: boolean = false; // Track if the file has been uploaded successfully
  isLoadingAnalysis: boolean = false; // Track if analysis results are being loaded
  analysisPollingInterval: any = null; // For storing the polling interval ID
  maxPollingAttempts: number = 20; // Max polling attempts (20 attempts * 2 seconds = 40 seconds max wait time)
  pollingAttempts: number = 0;
  
  // Properties for partenaire edit modal
  showPartenaireEditModal: boolean = false;
  editingPartenaire: PartenaireDto = { id: '', type: TypePartenaire.Entreprise };
  editingPartenaireField: Field | null = null;
  editingPartenaireId: string = '';
  editingCustomDomaine: string = '';
  
  // Expose TypePartenaire enum to the template
  TypePartenaire = TypePartenaire;
    // Services injected using Angular's inject function
  private countriesService = inject(CountriesService);  private userService = inject(UserService);
  private clientService = inject(ClientService);
  private bailleurDeFondsService = inject(BailleurDeFondsService); // Inject the bailleurs service
  private opportuniteService = inject(OpportuniteService);
  private partenaireService = inject(PartenaireService); // Add this line
  private opportuniteDocumentService = inject(OpportuniteDocumentService); // Add document service
  private analysisResultsService = inject(AnalysisResultsService); // Add analysis results service
  private permissionService = inject(PermissionService); // Add permission service
  private debugService = inject(DebugService); // Add debug service for troubleshooting
  private router = inject(Router);
  private route = inject(ActivatedRoute);
    // Properties for edit mode
  isEditMode: boolean = false;
  editingOpportunityId: string | null = null;
  isLoadingEditData: boolean = false;
  
  // Mock list of existing clients - will be replaced by API data
  existingClients: string[] = ['Orange', 'Société Générale', 'BNP Paribas', 'EDF', 'AXA', 'Total'];
  
  // Add a new property to track if a client is selected from existing ones
  selectedClientId: string | null = null;

  steps: Step[] = [
    {
      title: "Informations Générales",
      fields: [
        { name: 'titre', label: 'Titre', value: '', type: 'text' },
        { name: 'description', label: 'Description', value: '', type: 'textarea' },        { 
          name: 'paysOpportunite', 
          label: 'Pays de l\'opportunité', 
          value: '', 
          type: 'select',
          options: [] // Will be populated by the countries API
        },
        { name: 'dateFin', label: 'Date soumission', value: '', type: 'date' },
        { name: 'duree', label: 'Durée prévisionelle du projet (mois)', value: '', type: 'number' },// Removed readonly: true
        { 
          name: 'monnaie', 
          label: 'Monnaie', 
          value: '', 
          type: 'select',
          options: ['AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
            'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
            'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
            'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
            'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'FOK', 'GBP', 'GEL', 'GGP', 'GHS',
            'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF',
            'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD',
            'JPY', 'KES', 'KGS', 'KHR', 'KID', 'KMF', 'KRW', 'KWD', 'KYD', 'KZT',
            'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD',
            'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN',
            'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK',
            'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR',
            'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP',
            'STN', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD',
            'TVD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES', 'VND',
            'VUV', 'WST', 'XAF', 'XCD', 'XDR', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWL']        },
        { 
          name: 'nature', 
          label: 'Nature', 
          value: '', 
          type: 'select',
          options: getNatureDisplayNames()
        },        { 
          name: 'offre', 
          label: 'Offre', 
          value: '', 
          type: 'select-or-text',
          options: ['e-ID', 'TMT', 'GPS', 'Architecture', 'FS', 'Private'],
          customValue: ''
        },
        { name: 'linkTeams1', label: 'Lien Teams', value: '', type: 'url' }
      ]
    },
    {
      title: "Informations Particulières",
      fields: [
        { 
          name: 'nomClient', 
          label: 'Nom Client', 
          value: '', 
          type: 'select-or-text',
          options: this.existingClients,
          customValue: ''
        },
        { name: 'contactNom', label: 'Contact Clé', value: '', type: 'text' },
        { 
          name: 'pays', 
          label: 'Pays', 
          value: '', 
          type: 'select',
          options: ['France', 'Belgique', 'Suisse', 'Maroc', 'Tunisie', 'Autre']
        },
        { 
          name: 'type', 
          label: 'Type', 
          value: '', 
          type: 'select',
          options: ['Secteur Public', 'Secteur Privé']
        },
        { name: 'adresse', label: 'Adresse email', value: '', type: 'text' },
        { name: 'telephone', label: 'Téléphone', value: '', type: 'text' },
        { 
          name: 'bailleurFondsExists', 
          label: 'Y a-t-il un ou plusieurs bailleurs de fonds pour cette opportunité ?', 
          value: '', 
          type: 'radio',
          options: ['Oui', 'Non']
        },
        { 
          name: 'bailleurFonds', 
          label: 'Bailleur de Fonds', 
          value: '', 
          type: 'multi-select',
          options: [], // Will be populated from API
          selectedValues: [],
          selectedUserIds: [],
          customValue: '',
          showWhen: { field: 'bailleurFondsExists', value: 'Oui' }
        }
      ]
    },    {
      title: "Equipe Projet",
      fields: [
        { 
          name: 'associeCharge', 
          label: 'Associé en charge', 
          value: '', 
          type: 'select',
          options: ['Jean Dupont', 'Marie Lambert', 'Thomas Martin', 'Sophie Bernard', 'Paul Durand']
        },
        { 
          name: 'seniorManagerEnCharge', 
          label: 'Senior Manager en charge', 
          value: '', 
          type: 'select',
          options: ['Alexandre Petit', 'Camille Moreau', 'Lucas Dubois', 'Julie Leroy', 'Nicolas Roux']
        },        { 
          name: 'managerCharge', 
          label: 'Manager en charge', 
          value: '', 
          type: 'select',
          options: ['Alexandre Petit', 'Camille Moreau', 'Lucas Dubois', 'Julie Leroy', 'Nicolas Roux']
        },
        { 
          name: 'equipe', 
          label: 'Membres de l\'équipe', 
          value: '', 
          type: 'multi-select',
          options: ['Consultant 1', 'Consultant 2', 'Consultant 3', 'Consultant 4', 'Consultant 5',
                   'Analyst 1', 'Analyst 2', 'Analyst 3', 'Senior Consultant 1', 'Senior Consultant 2'],
          selectedValues: [], // Initialize empty array for selected team members
          selectedUserIds: [] // Initialize empty array for selected user IDs
        },
        {
          name: 'partenaireExists',
          label: 'Y a-t-il un ou plusieurs partenaires pour cette opportunité ?',
          value: '',
          type: 'radio',
          options: ['Oui', 'Non']
        },
        { 
          name: 'partenairesMulti', 
          label: 'Partenaires', 
          value: '', 
          type: 'multi-select',
          options: [], // Will be populated from API
          selectedValues: [],
          selectedPartenaireIds: [],
          partenaireDetails: {},
          customValue: '',
          showWhen: { field: 'partenaireExists', value: 'Oui' }
        }
      ]
    }
  ];

  constructor() { }  ngOnInit(): void {
    // Check for edit mode from route parameters
    this.route.queryParams.subscribe(async params => {
      console.log('Route params received:', params);
      if (params['id']) {
        console.log('Edit mode detected with ID:', params['id']);
        this.isEditMode = true;
        this.editingOpportunityId = params['id'];
        
        // Wait for all reference data to load before populating form
        await this.loadAllReferenceData();
        this.loadOpportunityForEdit(params['id']);
      } else {
        console.log('Create mode detected');
          // Check if user has permission to create opportunities
        this.permissionService.canCreateOpportunity().subscribe(canCreate => {
          console.log('NouveauOpportuniteComponent: Permission check result:', canCreate);
          
          if (!canCreate) {
            console.warn('NouveauOpportuniteComponent: User does not have permission to create opportunities');
            alert('Vous n\'avez pas les autorisations nécessaires pour créer une opportunité. Seuls les Manager, Senior Manager, Director et Associé peuvent créer des opportunités.');
            this.router.navigate(['/layout/opportunites']);
            return;
          }
          
          console.log('NouveauOpportuniteComponent: User authorized to create opportunities');
          this.isEditMode = false;
          this.isLoadingEditData = false;
          // Load reference data asynchronously for create mode
          this.loadAllReferenceDataAsync();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.clearAnalysisPolling();
  }

  // Method to load all reference data synchronously (for edit mode)
  private async loadAllReferenceData(): Promise<void> {
    console.log('Loading all reference data synchronously...');
    
    try {
      // Load all reference data in parallel and wait for completion
      await Promise.all([
        this.loadCountriesAsync(),
        this.loadUsersAsync(),
        this.loadClientsAsync(),
        this.loadBailleursDeFondsAsync(),
        this.loadPartenairesAsync()
      ]);
      
      console.log('All reference data loaded successfully');
    } catch (error) {
      console.error('Error loading reference data:', error);
      throw error;
    }
  }

  // Method to load all reference data asynchronously (for create mode)
  private loadAllReferenceDataAsync(): void {
    console.log('Loading all reference data asynchronously...');
    this.loadCountries();
    this.loadUsers();
    this.loadClients();
    this.loadBailleursDeFonds();
    this.loadPartenaires();
  }

  // Async version of loadCountries
  private async loadCountriesAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingCountries = true;
      this.countriesService.getAllCountries().subscribe({
        next: (data) => {
          this.countries = data;
          this.updateCountryFields();
          this.isLoadingCountries = false;
          console.log('Countries loaded:', this.countries.length);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching countries:', error);
          this.isLoadingCountries = false;
          reject(error);
        }
      });
    });
  }  // Async version of loadUsers
  private async loadUsersAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getUsers().subscribe({
        next: (data) => {
          this.associeUsers = data.filter(user => user.role === Role.Associe);
          this.managerUsers = data.filter(user => user.role === Role.Manager);
          
          // Filter users for senior manager field (only Associé, Directeur, Senior Manager - NO Manager)
          this.seniorManagerUsers = data.filter((user: UserDto) => {
            return user.role === Role.Associe || 
                   user.role === Role.Directeur || 
                   user.role === Role.SeniorManager;
          });
          
          // Include all business roles for team members (everyone except Admin and User)
          this.teamUsers = data.filter((user: UserDto) => {
            return user.role === Role.Junior || 
                   user.role === Role.Senior || 
                   user.role === Role.AssistantManager || 
                   user.role === Role.Manager || 
                   user.role === Role.SeniorManager || 
                   user.role === Role.Directeur || 
                   user.role === Role.Associe;
          });
          // Update field options (same as loadUsers method)
          this.updateUserFields();
          console.log('Users loaded - Associés:', this.associeUsers.length, 'Managers:', this.managerUsers.length, 'Senior Managers:', this.seniorManagerUsers.length, 'Team:', this.teamUsers.length);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching users:', error);
          reject(error);
        }
      });
    });
  }  // Update user fields method
  private updateUserFields(): void {
    // Update the associeCharge field options
    const associeField = this.steps.find((step: Step) => step.title === "Equipe Projet")
      ?.fields.find((field: Field) => field.name === 'associeCharge');
    
    if (associeField) {
      associeField.userData = this.associeUsers;
      associeField.options = this.associeUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
    }

    // Update the managerCharge field options
    const managerField = this.steps.find((step: Step) => step.title === "Equipe Projet")
      ?.fields.find((field: Field) => field.name === 'managerCharge');
    
    if (managerField) {
      managerField.userData = this.managerUsers;
      managerField.options = this.managerUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
    }

    // Update the coManagerEnCharge field options
    const coManagerField = this.steps.find((step: Step) => step.title === "Equipe Projet")
      ?.fields.find((field: Field) => field.name === 'coManagerEnCharge');
    
    if (coManagerField) {
      coManagerField.userData = this.managerUsers;
      coManagerField.options = this.managerUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
    }

    // Update the seniorManagerEnCharge field options - USE SENIOR MANAGER USERS ONLY
    const seniorManagerField = this.steps.find((step: Step) => step.title === "Equipe Projet")
      ?.fields.find((field: Field) => field.name === 'seniorManagerEnCharge');
    
    if (seniorManagerField) {
      seniorManagerField.userData = this.seniorManagerUsers;
      seniorManagerField.options = this.seniorManagerUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
    }
    
    // Update the equipe field options
    const equipeField = this.steps.find((step: Step) => step.title === "Equipe Projet")
      ?.fields.find((field: Field) => field.name === 'equipe');
    
    if (equipeField) {
      equipeField.userData = this.teamUsers;
      equipeField.options = this.teamUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
      equipeField.selectedValues = [];
      equipeField.selectedUserIds = [];
    }
  }

  // Async version of loadClients
  private async loadClientsAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingClients = true;
      this.clientService.getClients().subscribe({
        next: (data) => {
          this.clients = data;
          this.updateClientFields();
          this.isLoadingClients = false;
          console.log('Clients loaded:', this.clients.length);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching clients:', error);
          this.isLoadingClients = false;
          reject(error);
        }
      });
    });
  }
  // Async version of loadBailleursDeFonds
  private async loadBailleursDeFondsAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingBailleursDeFonds = true;
      this.bailleurDeFondsService.getBailleursDeFonds().subscribe({
        next: (data) => {
          this.bailleursDeFonds = data;
          this.updateBailleursDeFondsFields();
          this.isLoadingBailleursDeFonds = false;
          console.log('Bailleurs de fonds loaded:', this.bailleursDeFonds.length);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching bailleurs de fonds:', error);
          this.isLoadingBailleursDeFonds = false;
          reject(error);
        }
      });
    });
  }

  // Async version of loadPartenaires
  private async loadPartenairesAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingPartenaires = true;
      this.partenaireService.getPartenaires().subscribe({
        next: (data) => {
          this.partenaires = data;
          this.updatePartenaireFields();
          this.isLoadingPartenaires = false;
          console.log('Partenaires loaded:', this.partenaires.length);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching partenaires:', error);
          this.isLoadingPartenaires = false;
          reject(error);
        }
      });
    });
  }
  // Method to load and populate existing opportunity data for editing
  async loadOpportunityForEdit(opportunityId: string): Promise<void> {
    try {
      this.isLoadingEditData = true;
      console.log('Loading opportunity for edit:', opportunityId);
      
      // Fetch the opportunity data
      const opportunity = await firstValueFrom(
        this.opportuniteService.getOpportuniteById(opportunityId)
      );
      
      console.log('Loaded opportunity data:', opportunity);
      
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }
      
      // Check if user has permission to edit this opportunity
      const canEdit = await firstValueFrom(this.permissionService.canEditOpportunity(opportunity));
      if (!canEdit) {
        alert('Vous n\'avez pas les autorisations nécessaires pour modifier cette opportunité. Seuls l\'associé en charge, le senior manager en charge, le manager en charge et le co-manager en charge peuvent la modifier.');
        this.router.navigate(['/layout/opportunites']);
        return;
      }
      
      // Store the opportunity ID for update operations
      this.createdOpportuniteId = opportunityId;
      
      // Populate basic information fields
      this.populateBasicFields(opportunity);
      
      // Populate client information
      await this.populateClientFields(opportunity);
      
      // Populate team and user fields
      await this.populateTeamFields(opportunity);
      
      // Populate partenaire fields
      await this.populatePartenaireFields(opportunity);
        // Populate bailleur de fonds fields
      await this.populateBailleurFields(opportunity);
      
      console.log('Successfully populated all fields for editing');
      this.isLoadingEditData = false;
      
    } catch (error) {
      console.error('Error loading opportunity for edit:', error);
      this.isLoadingEditData = false;
      alert('Erreur lors du chargement de l\'opportunité pour modification.');
    }
  }

  // Helper method to populate basic information fields
  private populateBasicFields(opportunity: OpportuniteDto): void {
    // Update basic fields
    this.updateFieldValue(0, 'titre', opportunity.nomOpportunite);
    this.updateFieldValue(0, 'description', opportunity.description);
    this.updateFieldValue(0, 'paysOpportunite', opportunity.pays);
    
    // Handle nature field - convert enum value to display name
    if (opportunity.nature !== undefined) {
      const natureDisplayNames = getNatureDisplayNames();
      const natureDisplayName = natureDisplayNames[opportunity.nature];
      this.updateFieldValue(0, 'nature', natureDisplayName);
    }
      // Handle dates - only handle dateFin since dateDebut is now automatically current date
    if (opportunity.dateFin) {
      const dateFin = new Date(opportunity.dateFin);
      this.updateFieldValue(0, 'dateFin', dateFin.toISOString().split('T')[0]);
    }
    
    // Update duration
    this.updateFieldValue(0, 'duree', opportunity.duree);
      // Update currency and offer
    this.updateFieldValue(0, 'monnaie', opportunity.monnaie);
    this.updateFieldValue(0, 'offre', opportunity.offre);
    this.updateFieldValue(0, 'linkTeams1', opportunity.linkTeams1);
  }

  // Helper method to populate client fields
  private async populateClientFields(opportunity: OpportuniteDto): Promise<void> {
    if (opportunity.clientId) {
      try {
        // Find the client in our loaded clients
        const client = this.clients.find(c => c.id === opportunity.clientId);
        
        if (client) {
          // Set selected client
          this.selectedClientId = client.id;
          
          // Update client field to show the selected client name
          this.updateFieldValue(1, 'nomClient', client.nomClient);
          
          // Populate client details in form
          this.updateFieldValue(1, 'contactNom', client.contactNom);
          this.updateFieldValue(1, 'pays', client.pays);
          this.updateFieldValue(1, 'type', client.type);
          this.updateFieldValue(1, 'adresse', client.adresse);
          this.updateFieldValue(1, 'telephone', client.telephone);
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      }
    }
  }
  // Helper method to populate team fields
  private async populateTeamFields(opportunity: OpportuniteDto): Promise<void> {
    // Handle associé en charge
    if (opportunity.associeEnCharge) {
      const associe = this.associeUsers.find(u => u.id === opportunity.associeEnCharge);
      if (associe) {
        this.updateFieldValue(2, 'associeCharge', `${associe.nom} ${associe.prenom}`);
      }
    }
      // Handle manager en charge
    if (opportunity.managerEnCharge) {
      const manager = this.managerUsers.find(u => u.id === opportunity.managerEnCharge);
      if (manager) {
        this.updateFieldValue(2, 'managerCharge', `${manager.nom} ${manager.prenom}`);
      }
    }

    // Handle co-manager en charge
    if (opportunity.coManagerEnCharge) {
      const coManager = this.managerUsers.find(u => u.id === opportunity.coManagerEnCharge);
      if (coManager) {
        this.updateFieldValue(2, 'coManagerEnCharge', `${coManager.nom} ${coManager.prenom}`);
      }
    }
    
    // Handle senior manager en charge - USE SENIOR MANAGER USERS ARRAY
    if (opportunity.seniorManagerEnCharge) {
      const seniorManager = this.seniorManagerUsers.find(u => u.id === opportunity.seniorManagerEnCharge);
      if (seniorManager) {
        this.updateFieldValue(2, 'seniorManagerEnCharge', `${seniorManager.nom} ${seniorManager.prenom}`);
      }
    }
    
    // Handle équipe projet
    if (opportunity.equipeProjet && opportunity.equipeProjet.length > 0) {
      const equipeField = this.getField(2, 'equipe');
      if (equipeField) {
        equipeField.selectedUserIds = [...opportunity.equipeProjet];
        equipeField.selectedValues = opportunity.equipeProjet.map(userId => {
          const user = this.teamUsers.find(u => u.id === userId);
          return user ? `${user.nom} ${user.prenom}` : '';
        }).filter(name => name !== '');
      }
    }
    
    // Handle partner existence
    const hasPartners = opportunity.partnerExists || (opportunity.partenaireId && opportunity.partenaireId.length > 0);
    this.updateFieldValue(2, 'partenaireExists', hasPartners ? 'Oui' : 'Non');
  }

  // Helper method to populate partenaire fields
  private async populatePartenaireFields(opportunity: OpportuniteDto): Promise<void> {
    if (opportunity.partenaireId && opportunity.partenaireId.length > 0) {
      try {
        const partenaireField = this.getField(2, 'partenairesMulti');
        if (partenaireField) {
          partenaireField.selectedPartenaireIds = [...opportunity.partenaireId];
          partenaireField.selectedValues = [];
          partenaireField.partenaireDetails = {};
          
          // Load partenaire details
          for (const partenaireId of opportunity.partenaireId) {
            const partenaire = this.partenaires.find(p => p.id === partenaireId);
            if (partenaire) {
              partenaireField.selectedValues.push(partenaire.nom || '');
              partenaireField.partenaireDetails[partenaireId] = partenaire;
            }
          }
        }
      } catch (error) {
        console.error('Error loading partenaire data:', error);
      }
    }
  }

  // Helper method to populate bailleur de fonds fields
  private async populateBailleurFields(opportunity: OpportuniteDto): Promise<void> {
    // Handle bailleur existence
    const hasBailleurs = opportunity.bailleurExists || (opportunity.idBailleurDeFonds && opportunity.idBailleurDeFonds.length > 0);
    this.updateFieldValue(1, 'bailleurFondsExists', hasBailleurs ? 'Oui' : 'Non');
    
    if (opportunity.idBailleurDeFonds && opportunity.idBailleurDeFonds.length > 0) {
      try {
        const bailleurField = this.getField(1, 'bailleurFonds');
        if (bailleurField) {
          bailleurField.selectedUserIds = [...opportunity.idBailleurDeFonds];
          bailleurField.selectedValues = opportunity.idBailleurDeFonds.map(bailleurId => {
            const bailleur = this.bailleursDeFonds.find(b => b.id === bailleurId);
            return bailleur ? bailleur.nomBailleur : '';
          }).filter(name => name !== '');
        }
      } catch (error) {
        console.error('Error loading bailleur de fonds data:', error);
      }
    }
  }

  loadCountries(): void {
    this.isLoadingCountries = true;
    this.countriesService.getAllCountries().subscribe({
      next: (data) => {
        this.countries = data;
        // Update any country dropdown fields
        this.updateCountryFields();
        this.isLoadingCountries = false;
      },
      error: (error) => {
        console.error('Error fetching countries:', error);
        this.isLoadingCountries = false;
      }
    });
  }

  updateCountryFields(): void {
    // Find all fields with name 'pays' and update their options
    for (let step of this.steps) {
      for (let field of step.fields) {
        if (field.name === 'pays' && field.type === 'select') {
          field.options = this.countries.map((country: Country) => country.name.common);
        }
        if (field.name === 'paysOpportunite' && field.type === 'select') {
          field.options = this.countries.map((country: Country) => country.name.common);
        }
      }
    }
  }
  // File handling methods
  async onFileSelected(event: any): Promise<void> {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      console.log('File selected:', this.selectedFile);
      
      // Create an empty opportunité and upload the file immediately
      if (this.selectedFile) {
        await this.createEmptyOpportuniteAndUploadFile(this.selectedFile);
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    // Reset the file input and opportunité ID
    const fileInput = document.getElementById('opportunityFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    // Don't reset the opportunité ID as we'll update it when submitting the form
  }

  // Handle drag and drop events
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
    
    // Add dragover class to file container
    const fileContainer = document.querySelector('.file-import-container');
    if (fileContainer) {
      fileContainer.classList.add('dragover');
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    // Remove dragover class
    const fileContainer = document.querySelector('.file-import-container');
    if (fileContainer) {
      fileContainer.classList.remove('dragover');
    }
  }
  @HostListener('drop', ['$event'])
  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    // Remove dragover class
    const fileContainer = document.querySelector('.file-import-container');
    if (fileContainer) {
      fileContainer.classList.remove('dragover');
    }
    
    // Handle the dropped files
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
      console.log('File dropped:', this.selectedFile);
      
      // Create an empty opportunité and upload the file immediately
      if (this.selectedFile) {
        await this.createEmptyOpportuniteAndUploadFile(this.selectedFile);
      }
    }
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      window.scrollTo(0, 0);
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  // Add goToStep method to handle navigation when clicking on step circles
  goToStep(stepIndex: number): void {
    // Don't allow navigating beyond the last step
    if (stepIndex >= this.steps.length) {
      return;
    }

    // Don't allow skipping steps - can only go to completed steps or the next step
    if (stepIndex > this.currentStep + 1) {
      return;
    }

    this.currentStep = stepIndex;
    window.scrollTo(0, 0);
  }  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        // Filter users with role Associe
        this.associeUsers = users.filter((user: UserDto) => user.role === Role.Associe);
        
        // Filter users with roles Manager, Senior Manager, Directeur and Associe
        this.managerUsers = users.filter((user: UserDto) => {
          return user.role === Role.Manager || 
                 user.role === Role.SeniorManager || 
                 user.role === Role.Directeur || 
                 user.role === Role.Associe;
        });
        
        // Filter users for senior manager field (only Associé, Directeur, Senior Manager - NO Manager)
        this.seniorManagerUsers = users.filter((user: UserDto) => {
          return user.role === Role.Associe || 
                 user.role === Role.Directeur || 
                 user.role === Role.SeniorManager;
        });
        
        // Include all business roles for team members (everyone except Admin and User)
        this.teamUsers = users.filter((user: UserDto) => {
          return user.role === Role.Junior || 
                 user.role === Role.Senior || 
                 user.role === Role.AssistantManager || 
                 user.role === Role.Manager || 
                 user.role === Role.SeniorManager || 
                 user.role === Role.Directeur || 
                 user.role === Role.Associe;
        });
        
        // Update the associeCharge field options
        const associeField = this.steps.find((step: Step) => step.title === "Equipe Projet")
          ?.fields.find((field: Field) => field.name === 'associeCharge');
        
        if (associeField) {
          associeField.userData = this.associeUsers;
          associeField.options = this.associeUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
        }
          // Update the managerCharge field options
        const managerField = this.steps.find((step: Step) => step.title === "Equipe Projet")
          ?.fields.find((field: Field) => field.name === 'managerCharge');
        
        if (managerField) {
          managerField.userData = this.managerUsers;
          managerField.options = this.managerUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
        }

        // Update the coManagerEnCharge field options
        const coManagerField = this.steps.find((step: Step) => step.title === "Equipe Projet")
          ?.fields.find((field: Field) => field.name === 'coManagerEnCharge');
        
        if (coManagerField) {
          coManagerField.userData = this.managerUsers;
          coManagerField.options = this.managerUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
        }

        // Update the seniorManagerEnCharge field options - USE SENIOR MANAGER USERS ONLY
        const seniorManagerField = this.steps.find((step: Step) => step.title === "Equipe Projet")
          ?.fields.find((field: Field) => field.name === 'seniorManagerEnCharge');
        
        if (seniorManagerField) {
          seniorManagerField.userData = this.seniorManagerUsers;
          seniorManagerField.options = this.seniorManagerUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
        }
        
        // Update the equipe field options
        const equipeField = this.steps.find((step: Step) => step.title === "Equipe Projet")
          ?.fields.find((field: Field) => field.name === 'equipe');
        
        if (equipeField) {
          equipeField.userData = this.teamUsers;
          equipeField.options = this.teamUsers.map((user: UserDto) => `${user.nom} ${user.prenom}`);
          equipeField.selectedValues = [];
          equipeField.selectedUserIds = [];
        }
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      }
    });
  }

  loadClients(): void {
    this.isLoadingClients = true;
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.updateClientFields();
        this.isLoadingClients = false;
      },
      error: (error) => {
        console.error('Error fetching clients:', error);
        this.isLoadingClients = false;
      }
    });
  }

  updateClientFields(): void {
    // Find the nomClient field and update its options
    for (let step of this.steps) {
      for (let field of step.fields) {
        if (field.name === 'nomClient' && field.type === 'select-or-text') {
          // Update options with client names
          field.options = this.clients.map((client: ClientDto) => client.nomClient || '');
        }
      }
    }  }

  // Add a new method to handle client selection changes
  onClientSelectionChange(clientName: string): void {
    // Find the client by name
    const selectedClient = this.clients.find(client => client.nomClient === clientName);
    
    if (selectedClient) {
      // Store the selected client ID
      this.selectedClientId = selectedClient.id;
      
      // For existing client selection, directly fill the form fields without showing the card
      // The card should only be shown for document autofill scenarios
      this.showClientInfoBox = false;
      
      // Update all the client-related fields with the client's data
      const step = this.steps.find(step => step.title === "Informations Particulières");
      if (step) {
        // Find each field and update its value
        const updateField = (fieldName: string, value: string) => {
          const field = step.fields.find(f => f.name === fieldName);
          if (field) {
            field.value = value || '';
          }
        };
        
        // Update each field with the client data
        updateField('contactNom', selectedClient.contactNom || '');
        updateField('pays', selectedClient.pays || '');
        updateField('type', selectedClient.type || '');
        updateField('adresse', selectedClient.adresse || '');
        updateField('telephone', selectedClient.telephone || '');
        
        // Ensure fields are displayed by setting them as if 'autre' was selected
        // but we'll handle this in the shouldDisplayField method
      }
      
      console.log('Loaded client data:', selectedClient);
    } else {
      // If "autre" or a non-existing client is selected, reset the fields
      this.selectedClientId = null;
      this.showClientInfoBox = false;
      
      // Reset all client-related fields
      const step = this.steps.find(step => step.title === "Informations Particulières");
      if (step) {
        const clientFields = ['contactNom', 'pays', 'type', 'adresse', 'telephone'];
        clientFields.forEach(fieldName => {
          const field = step.fields.find(f => f.name === fieldName);
          if (field) {
            field.value = '';
          }
        });
      }
    }
  }

  loadBailleursDeFonds(): void {
    this.isLoadingBailleursDeFonds = true;
    this.bailleurDeFondsService.getBailleursDeFonds().subscribe({
      next: (bailleursDeFonds) => {
        this.bailleursDeFonds = bailleursDeFonds;
        this.updateBailleursDeFondsFields();
        this.isLoadingBailleursDeFonds = false;      },
      error: (error) => {
        console.error('Error fetching bailleurs de fonds:', error);
        this.isLoadingBailleursDeFonds = false;
      }
    });
  }

  updateBailleursDeFondsFields(): void {
    // Find the bailleurFonds field and update its options
    for (let step of this.steps) {
      for (let field of step.fields) {
        if (field.name === 'bailleurFonds') {
          // Update options with bailleur de fonds names from API
          field.options = this.bailleursDeFonds.map((bailleur: BailleurDeFondDto) => bailleur.nomBailleur);
          // Initialize arrays if they don't exist
          if (!field.selectedValues) {
            field.selectedValues = [];
          }
          if (!field.selectedUserIds) {
            field.selectedUserIds = [];
          }
        }
      }
    }
  }

  async onSubmit(skipRedirect: boolean = false): Promise<void> {
    const formData = JSON.parse(JSON.stringify(this.steps));
    
    try {
      // Check permissions before submitting
      if (this.isEditMode) {
        // For edit mode, check if user can edit this opportunity
        if (this.createdOpportuniteId) {
          const opportunity = await firstValueFrom(
            this.opportuniteService.getOpportuniteById(this.createdOpportuniteId)
          );
          const canEdit = await firstValueFrom(this.permissionService.canEditOpportunity(opportunity));
          if (!canEdit) {
            alert('Vous n\'avez pas les autorisations nécessaires pour modifier cette opportunité.');
            return;
          }
        }
      } else {
        // For create mode, check if user can create opportunities
        const canCreate = await firstValueFrom(this.permissionService.canCreateOpportunity());
        if (!canCreate) {
          alert('Vous n\'avez pas les autorisations nécessaires pour créer une opportunité.');
          this.router.navigate(['/layout/opportunites']);
          return;
        }
      }
      
      // Add logging for nature field value before submission
      const natureField = formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'nature');
      console.log('Nature field value before conversion:', natureField?.value);
      
      // Convert nature field value to Nature | undefined
      const convertedNature = natureField?.value ? getNatureFromDisplayName(natureField.value) ?? undefined : undefined;
      console.log('Nature value after conversion:', convertedNature);
      
      // Validate required fields first
      const requiredFields = {
        'titre': 'Titre',
        'description': 'Description',
        'paysOpportunite': 'Pays de l\'opportunité',
        'nature': 'Nature',
        'monnaie': 'Monnaie',
        'offre': 'Offre',
        'duree': 'Durée',
        'nomClient': 'Nom Client',
        'contactNom': 'Contact Clé',
        'pays': 'Pays',
        'type': 'Type',
        'associeCharge': 'Associé en charge',
        'managerCharge': 'Manager en charge',
        'equipe': 'Membres de l\'équipe',
        'bailleurFondsExists': 'Présence de bailleurs de fonds',
        'partenaireExists': 'Présence de partenaires'
      };
  
      let missingFields = [];
      for (const [fieldName, label] of Object.entries(requiredFields)) {
        const field = this.steps.find(step => 
          step.fields.some(field => field.name === fieldName))
          ?.fields.find(field => field.name === fieldName);
        
        if (!field) {
          missingFields.push(label);
        } else if (fieldName === 'equipe') {
          if (!field.selectedValues || field.selectedValues.length === 0) {
            missingFields.push(label);
          }
        } else if (!field.value) {
          missingFields.push(label);
        }
      }
  
      // Special handling for bailleur de fonds when it exists
      const bailleurFondsExists = formData.find((step: Step) => step.title === "Informations Particulières")
        ?.fields.find((field: Field) => field.name === 'bailleurFondsExists')?.value;
      
      const bailleurFondsField = formData.find((step: Step) => step.title === "Informations Particulières")
        ?.fields.find((field: Field) => field.name === 'bailleurFonds');
      
      if (bailleurFondsExists === 'Oui' && (!bailleurFondsField?.selectedValues || bailleurFondsField.selectedValues.length === 0)) {
        missingFields.push('Bailleur de Fonds');
      }
  
      if (missingFields.length > 0) {
        alert(`Veuillez remplir les champs obligatoires suivants:\n${missingFields.join('\n')}`);
        return;
      }
  
      // Handle client creation or update
      const clientField = formData.find((step: Step) => step.title === "Informations Particulières")
        ?.fields.find((field: Field) => field.name === 'nomClient');
      
      let clientId = '';
      let clientData = null;
      if (clientField) {
        // If we selected an existing client and have its ID
        if (this.selectedClientId) {
          clientId = this.selectedClientId;
          
          // Get the current client data
          const existingClient = this.clients.find(c => c.id === clientId);
          
          // Prepare update data with form values
          const updatedClient: ClientDto = {
            id: clientId,
            nomClient: existingClient?.nomClient || clientField.value,
            type: formData.find((step: Step) => step.title === "Informations Particulières")
              ?.fields.find((field: Field) => field.name === 'type')?.value || '',
            adresse: formData.find((step: Step) => step.title === "Informations Particulières")
              ?.fields.find((field: Field) => field.name === 'adresse')?.value || '',
            telephone: formData.find((step: Step) => step.title === "Informations Particulières")
              ?.fields.find((field: Field) => field.name === 'telephone')?.value || '',
            pays: formData.find((step: Step) => step.title === "Informations Particulières")
              ?.fields.find((field: Field) => field.name === 'pays')?.value || '',
            contactNom: formData.find((step: Step) => step.title === "Informations Particulières")
              ?.fields.find((field: Field) => field.name === 'contactNom')?.value || ''
          };
          
          try {
            // Update the client with new values
            await firstValueFrom(this.clientService.updateClient(clientId, updatedClient));
            clientData = updatedClient;
            console.log('Updated client data:', updatedClient);
          } catch (error: any) {
            console.error('Error updating client:', error);
            throw new Error(`Erreur lors de la mise à jour du client: ${error.error?.message || error.message || 'Erreur inconnue'}`);
          }
        } else {
          const existingClient = this.clients.find(c => c.nomClient === clientField.value);
          if (existingClient) {
            clientId = existingClient.id;
            clientData = existingClient;
          } else {
            // Create new client (existing code)
            const newClient: ClientDto = {
              id: '',
              nomClient: clientField.customValue || clientField.value,
              type: formData.find((step: Step) => step.title === "Informations Particulières")
                ?.fields.find((field: Field) => field.name === 'type')?.value || '',
              adresse: formData.find((step: Step) => step.title === "Informations Particulières")
                ?.fields.find((field: Field) => field.name === 'adresse')?.value || '',
              telephone: formData.find((step: Step) => step.title === "Informations Particulières")
                ?.fields.find((field: Field) => field.name === 'telephone')?.value || '',
              pays: formData.find((step: Step) => step.title === "Informations Particulières")
                ?.fields.find((field: Field) => field.name === 'pays')?.value || '',
              contactNom: formData.find((step: Step) => step.title === "Informations Particulières")
                ?.fields.find((field: Field) => field.name === 'contactNom')?.value || ''
            };
            try {
              const response = await firstValueFrom(this.clientService.createClient(newClient));
              // Handle string ID response
              clientId = typeof response === 'string' ? response : response?.id || '';
              // Store client data for logging
              clientData = { ...newClient, id: clientId };
            } catch (error: any) { // Type error as 'any' to access properties safely
              console.error('Error creating client:', error);
              throw new Error(`Erreur lors de la création du client: ${error.error?.message || error.message || 'Erreur inconnue'}`);
            }
          }
        }
      }
  
      // Handle bailleurs de fonds creation if needed
      const bailleurField = formData.find((step: Step) => step.title === "Informations Particulières")
        ?.fields.find((field: Field) => field.name === 'bailleurFonds');
      
      let bailleurIds: string[] = [];
      
      if (bailleurField?.selectedValues?.length > 0) {
        // Process each selected bailleur
        for (let i = 0; i < bailleurField.selectedValues.length; i++) {
          const bailleurValue = bailleurField.selectedValues[i];
          const currentId = bailleurField.selectedUserIds[i];
          
          // If it's a pending ID, we need to create a new bailleur
          if (currentId === 'pending') {
            try {
              const newBailleur: BailleurDeFondDto = {
                id: '',
                nomBailleur: bailleurValue
              };
              const response = await firstValueFrom(this.bailleurDeFondsService.createBailleurDeFonds(newBailleur));
              const newId = typeof response === 'string' ? response : response?.id;
              if (newId) {
                bailleurIds.push(newId);
                console.log('Created new bailleur de fonds:', bailleurValue, 'with ID:', newId);
              }
            } catch (error: any) {
              console.error('Error creating bailleur de fonds:', error);
              throw new Error(`Erreur lors de la création du bailleur de fonds ${bailleurValue}: ${error.error?.message || error.message || 'Erreur inconnue'}`);
            }
          } else {
            // If it's an existing bailleur, add its ID
            bailleurIds.push(currentId);
          }
        }
      }
  
      // Handle multiple partenaires creation/update
      const partenairesField = formData.find((step: Step) => step.title === "Equipe Projet")
        ?.fields.find((field: Field) => field.name === 'partenairesMulti');
      
      let partenaireIds: string[] = [];
      let partenairesData: PartenaireDto[] = [];
      
      if (partenairesField?.selectedPartenaireIds?.length > 0) {
        // Process each selected partenaire
        for (let i = 0; i < partenairesField.selectedPartenaireIds.length; i++) {
          const partenaireId = partenairesField.selectedPartenaireIds[i];
          const partenaireDetails = partenairesField.partenaireDetails?.[partenaireId];
          
          if (!partenaireDetails) {
            console.error('Missing details for partenaire ID:', partenaireId);
            continue;
          }
          
          // Check if it's a new partenaire
          if (partenaireId.startsWith('new_')) {
            // Create a new partenaire
            const newPartenaire: PartenaireDto = {
              id: '',
              type: partenaireDetails.type || TypePartenaire.Entreprise,
              nom: partenaireDetails.nom || '',
              domaine: partenaireDetails.domaine || '',
              contactCle: partenaireDetails.contactCle || ''
            };
            
            try {
              const response = await firstValueFrom(this.partenaireService.createPartenaire(newPartenaire));
              
              const newId = typeof response === 'string' ? response : response?.id || '';
              if (newId) {
                partenaireIds.push(newId);
                partenairesData.push({ ...newPartenaire, id: newId });
                console.log('Created new partenaire:', newPartenaire.nom, 'with ID:', newId);
              } else {
                throw new Error('La création du partenaire a échoué - ID non reçu');
              }
            } catch (error: any) {
              console.error('Error creating partenaire:', error);
              const errorMessage = error.error?.message || error.message || 'Erreur inconnue';
              alert(`Erreur lors de la création du partenaire ${newPartenaire.nom}: ${errorMessage}`);
            }
          } else {
            // Update existing partenaire if needed
            const existingPartenaire = this.partenaires.find(p => p.id === partenaireId);
            
            if (existingPartenaire) {
              // Check if any changes were made
              const hasChanges = 
                existingPartenaire.type !== partenaireDetails.type ||
                existingPartenaire.nom !== partenaireDetails.nom ||
                existingPartenaire.domaine !== partenaireDetails.domaine ||
                existingPartenaire.contactCle !== partenaireDetails.contactCle;
              
            
              if (hasChanges) {
                // Update the partenaire
                try {
                  const updatedPartenaire: PartenaireDto = {
                    id: partenaireId,
                    type: partenaireDetails.type,
                    nom: partenaireDetails.nom,
                    domaine: partenaireDetails.domaine,
                    contactCle: partenaireDetails.contactCle
                  };
                  
                  await firstValueFrom(this.partenaireService.updatePartenaire(partenaireId, updatedPartenaire));
                  console.log('Updated partenaire:', updatedPartenaire.nom, 'with ID:', partenaireId);
                  
                  // Add to list
                  partenaireIds.push(partenaireId);
                  partenairesData.push(updatedPartenaire);
                } catch (error: any) {
                  console.error('Error updating partenaire:', error);
                  const errorMessage = error.error?.message || error.message || 'Erreur inconnue';
                  alert(`Erreur lors de la mise à jour du partenaire ${partenaireDetails.nom}: ${errorMessage}`);
                }
              } else {
                // No changes, just add the ID
                partenaireIds.push(partenaireId);
                partenairesData.push(existingPartenaire);
              }
            } else {
              console.error('Partenaire not found in database:', partenaireId);
            }
          }
        }
      }
      
      // Check if we have any partenaires to include
      const partnerExists = partenaireIds.length > 0;
  
      // Create OpportuniteDto from form data with the new IDs
      const opportuniteDto = {
        ...this.mapFormDataToDto(formData, clientId, bailleurIds, partenaireIds),
        idBailleurDeFonds: bailleurIds,
        partnerExists: partenaireIds.length > 0 // Ensure this is explicitly a boolean
      };
        // Nature value is already converted above, just use it
      opportuniteDto.nature = convertedNature;
  
      // Determine if we need to update an existing opportunité or create a new one
      if (this.createdOpportuniteId) {
        // Update the existing opportunité that was created during file upload
        try {
          console.log('Updating existing opportunité with ID:', this.createdOpportuniteId);
          
          // Add the ID to the DTO for the update operation
          const opportuniteUpdateDto = {
            ...opportuniteDto,
            id: this.createdOpportuniteId
          };
          
          await firstValueFrom(this.opportuniteService.updateOpportunite(this.createdOpportuniteId, opportuniteUpdateDto));
          console.log('Opportunité mise à jour avec succès');
          
          // Log related data with detailed information
          console.log('----- OPPORTUNITÉ UPDATED SUCCESSFULLY -----');
          console.log('CLIENT:', {
            id: clientId,
            data: clientData,
            nomClient: clientData?.nomClient || 'N/A'
          });
          console.log('PARTENAIRES:', {
            ids: partenaireIds,
            exists: partnerExists,
            data: partenairesData,
            count: partenaireIds.length
          });
          console.log('BAILLEUR DE FONDS:', {
            id: bailleurIds,
            data: bailleurField?.selectedValues,
            nomBailleur: bailleurField?.selectedValues || 'N/A'
          });          console.log('FILE:', this.selectedFile ? this.selectedFile.name : 'No file');
          console.log('----------------------------------------');
          // Redirect to display-opportunites page only if not skipping redirect
          if (!skipRedirect) {
            this.router.navigate(['/layout/opportunites']);
          }
        } catch (error: any) {
          console.error('Erreur lors de la mise à jour de l\'opportunité:', error);
          console.error('Status:', error.status);
          console.error('Error details:', error.error);
          console.error('Data sent:', JSON.stringify(opportuniteDto, null, 2));
          alert(`Erreur lors de la mise à jour de l'opportunité. Code: ${error.status}. ${error.error?.error || error.message || ''}`);
        }
      } else {
        // No existing opportunité, create a new one
        try {
          console.log('Creating new opportunité');
          const response = await firstValueFrom(this.opportuniteService.createOpportunite(opportuniteDto));
          console.log('Opportunité créée avec succès:', response);
          
          // Get the opportunité ID from the response
          let opportuniteId = '';
          if (typeof response === 'string') {
            opportuniteId = response;
          } else if (response && response.id) {
            opportuniteId = response.id;
          }
          
          // Upload the document if a file is selected and we have an opportunité ID
          if (this.selectedFile && opportuniteId && !this.isFileUploaded) {
            try {
              console.log('Uploading document for opportunité:', opportuniteId);
              
              // Validate file type before attempting upload
              const fileExt = this.selectedFile.name.split('.').pop()?.toLowerCase();
              const allowedExtensions = ['pdf', 'doc', 'docx'];
              
              if (!fileExt || !allowedExtensions.includes(fileExt)) {
                console.error('Invalid file type:', fileExt);
                alert(`Le type de fichier n'est pas pris en charge. Types autorisés: PDF, DOC, DOCX.`);
                return;
              }
              
              // Validate file size (50MB limit as per backend)
              const maxSize = 50 * 1024 * 1024; // 50MB in bytes
              if (this.selectedFile.size > maxSize) {
                console.error('File too large:', this.selectedFile.size);
                alert(`Le fichier est trop volumineux. La taille maximale est de 50MB.`);
                return;
              }
              
              // Use a timeout to ensure the opportunité is fully processed on the backend
              setTimeout(async () => {
                try {
                  const fileUploadResponse = await firstValueFrom(
                    this.opportuniteDocumentService.uploadDocument(opportuniteId, this.selectedFile!)
                  );
                  console.log('Document uploaded successfully:', fileUploadResponse);
                } catch (fileError: any) {
                  console.error('Error uploading document:', fileError);
                  alert(`L'opportunité a été créée, mais le téléchargement du document a échoué: ${fileError.error?.message || fileError.message || 'Erreur inconnue'}`);
                }
              }, 1000); // Wait 1 second before attempting upload
              
            } catch (fileError: any) {
              console.error('Error uploading document:', fileError);
              alert(`L'opportunité a été créée, mais le téléchargement du document a échoué: ${fileError.error?.message || fileError.message || 'Erreur inconnue'}`);
            }
          }
          
          // Log related data with detailed information
          console.log('----- OPPORTUNITÉ CREATED SUCCESSFULLY -----');
          console.log('CLIENT:', {
            id: clientId,
            data: clientData,
            nomClient: clientData?.nomClient || 'N/A'
          });
          console.log('PARTENAIRES:', {
            ids: partenaireIds,
            exists: partnerExists,
            data: partenairesData,
            count: partenaireIds.length
          });
          console.log('BAILLEUR DE FONDS:', {
            id: bailleurIds,
            data: bailleurField?.selectedValues,
            nomBailleur: bailleurField?.selectedValues || 'N/A'          });
          console.log('----------------------------------------');        // Redirect to display-opportunites page only if not skipping redirect
        if (!skipRedirect) {
          this.router.navigate(['/layout/opportunites']);
        }
        } catch (error: any) {
          console.error('Erreur lors de la création de l\'opportunité:', error);
          console.error('Status:', error.status);
          console.error('Error details:', error.error);
          console.error('Data sent:', JSON.stringify(opportuniteDto, null, 2));
          alert(`Erreur lors de la création de l'opportunité. Code: ${error.status}. ${error.error?.error || error.message || ''}`);
        }
      }
    } catch (error: any) {
      console.error('Error in submission process:', error);
      alert(error.message || 'Une erreur est survenue lors du traitement. Veuillez réessayer.');
    }
  }
    // Method to save the opportunity during edit mode without navigating to the last step
  async onSave(): Promise<void> {
    if (!this.isEditMode) {
      console.warn('Save method called but not in edit mode');
      return;
    }

    try {
      console.log('Saving opportunity in edit mode...');
      await this.onSubmit(true); // Pass true to skip redirect
      
      // Show success message but don't redirect
      alert('Opportunité sauvegardée avec succès!');
      
    } catch (error: any) {
      console.error('Error saving opportunity:', error);
      // Error handling is already done in onSubmit method
    }
  }

  // Helper method to map form data to OpportuniteDto
  private mapFormDataToDto(formData: any[], clientId: string, bailleurIds: string[], partenaireIds?: string[]): Omit<OpportuniteDto, 'id'> {
    // Get values from form fields
    const getTitreField = () => {
      return formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'titre')?.value || '';
    };
    
    // Other getters remain the same...
    
    const getDescriptionField = () => {
      return formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'description')?.value || '';
    };    const getNatureField = () => {
      const displayValue = formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'nature')?.value || '';
      console.log('Nature field display value:', displayValue);
      const natureValue = getNatureFromDisplayName(displayValue);
      console.log('Nature field converted value:', natureValue);
      return natureValue ?? undefined; // Use nullish coalescing to convert null to undefined
    };
    
    const getPaysField = () => {
      return formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'paysOpportunite')?.value || '';
    };
      const getDateDebutField = () => {
      // Always use current date as start date
      return new Date();
    };
    
    const getDateFinField = () => {
      const dateStr = formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'dateFin')?.value;
      return dateStr ? new Date(dateStr) : undefined;
    };
    
    const getDureeField = () => {
      const dureeStr = formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'duree')?.value;
      return dureeStr ? parseInt(dureeStr) : undefined;
    };
    
    const getMonnaieField = () => {
      return formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'monnaie')?.value || '';
    };
      const getOffreField = () => {
      const field = formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'offre');
      return field?.value === 'autre' ? field?.customValue : field?.value || '';
    };
    
    const getLinkTeams1Field = () => {
      return formData.find((step: Step) => step.title === "Informations Générales")
        ?.fields.find((field: Field) => field.name === 'linkTeams1')?.value || '';
    };    const getAssocieEnChargeField = () => {
      const field = formData.find((step: Step) => step.title === "Equipe Projet")
        ?.fields.find((field: Field) => field.name === 'associeCharge');
      if (field?.userData && field.value) {
        const selectedUser = field.userData.find(
          (user: UserDto) => `${user.nom} ${user.prenom}` === field.value
        );
        return selectedUser?.id || '';
      }
      return '';
    };
      const getManagerEnChargeField = () => {
      const field = formData.find((step: Step) => step.title === "Equipe Projet")
        ?.fields.find((field: Field) => field.name === 'managerCharge');
      if (field?.userData && field.value) {
        const selectedUser = field.userData.find(
          (user: UserDto) => `${user.nom} ${user.prenom}` === field.value
        );
        return selectedUser?.id || '';
      }
      return '';
    };    const getCoManagerEnChargeField = () => {
      const field = formData.find((step: Step) => step.title === "Equipe Projet")
        ?.fields.find((field: Field) => field.name === 'coManagerEnCharge');
      if (field?.userData && field.value) {
        const selectedUser = field.userData.find(
          (user: UserDto) => `${user.nom} ${user.prenom}` === field.value
        );
        return selectedUser?.id || undefined;
      }
      return undefined;
    };    const getSeniorManagerEnChargeField = () => {
      const field = formData.find((step: Step) => step.title === "Equipe Projet")
        ?.fields.find((field: Field) => field.name === 'seniorManagerEnCharge');
      if (field?.userData && field.value) {
        const selectedUser = field.userData.find(
          (user: UserDto) => `${user.nom} ${user.prenom}` === field.value
        );
        return selectedUser?.id || undefined;
      }
      return undefined;
    };
    
    const getEquipeProjetField = () => {
      const field = formData.find((step: Step) => step.title === "Equipe Projet")
        ?.fields.find((field: Field) => field.name === 'equipe');
      return field?.selectedUserIds || [];
    };
    
    // Explicitly define partnerExists based on field value first
    const partnerExists = formData.find((step: Step) => step.title === "Equipe Projet")
      ?.fields.find((field: Field) => field.name === 'partenaireExists')?.value === 'Oui';
    
    const bailleurExists = formData.find((step: Step) => step.title === "Informations Particulières")
      ?.fields.find((field: Field) => field.name === 'bailleurFondsExists')?.value === 'Oui';
    
    const getBailleursDeFondsIds = () => {
      const field = formData.find((step: Step) => step.title === "Informations Particulières")
        ?.fields.find((field: Field) => field.name === 'bailleurFonds');
      return bailleurExists ? field?.selectedUserIds || [] : [];
    };

    // Create the base DTO without the id field
    const dto: Omit<OpportuniteDto, 'id'> = {
      nomOpportunite: getTitreField(),
      clientId: clientId,
      partnerExists: partnerExists,
      partenaireId: partnerExists ? partenaireIds || [] : [], // Only include partenaireIds if partnerExists is true
      description: getDescriptionField(),
      nature: getNatureField(),
      pays: getPaysField(),
      dateDebut: getDateDebutField(),
      dateFin: getDateFinField(),
      duree: getDureeField(),
      bailleurExists: bailleurExists,      idBailleurDeFonds: getBailleursDeFondsIds(),
      associeEnCharge: getAssocieEnChargeField(),
      managerEnCharge: getManagerEnChargeField(),
      coManagerEnCharge: getCoManagerEnChargeField(),      seniorManagerEnCharge: getSeniorManagerEnChargeField(),
      equipeProjet: getEquipeProjetField(),
      monnaie: getMonnaieField(),
      offre: getOffreField(),
      linkTeams1: getLinkTeams1Field()
    };

    // Debug logging
    console.log('Partner data debug:', {
      hasPartenaire: partnerExists,
      providedPartenaireIds: partenaireIds,
      mappedPartenaireId: dto.partenaireId,
      count: partenaireIds?.length || 0
    });

    return dto;
  }
    // Calculate duration when dates change - Modified to calculate from current date to submission date
  calculateDuration(currentDate: string, endDate: string): number | undefined {
    if (!endDate) return undefined;

    const current = new Date(currentDate);
    const end = new Date(endDate);
    
    if (isNaN(current.getTime()) || isNaN(end.getTime())) return undefined;

    // Calculate the difference in months
    const months = (end.getFullYear() - current.getFullYear()) * 12 +
                  (end.getMonth() - current.getMonth());
    
    // Add partial month if there are remaining days
    const remainingDays = end.getDate() - current.getDate();
    return months + (remainingDays > 0 ? 1 : 0);
  }
  onDateChange(): void {
    const endDateField = this.steps[0].fields.find(f => f.name === 'dateFin');
    const dureeField = this.steps[0].fields.find(f => f.name === 'duree');

    if (endDateField?.value) {
      // Use current date as start date
      const currentDate = new Date().toISOString().split('T')[0];
      const calculatedDuration = this.calculateDuration(currentDate, endDateField.value);
      if (calculatedDuration !== undefined && dureeField) {
        // Only set the duration value if it's greater than 0
        dureeField.value = calculatedDuration > 0 ? calculatedDuration.toString() : '';
      }
    }
  }

  // Auto-calculate duration based on current date and dateFin
  private autoCalculateDuration(): void {
    const endDateField = this.steps[0].fields.find(f => f.name === 'dateFin');
    const dureeField = this.steps[0].fields.find(f => f.name === 'duree');

    if (endDateField?.value && dureeField) {
      const currentDate = new Date().toISOString().split('T')[0];
      const calculatedDuration = this.calculateDuration(currentDate, endDateField.value);
      if (calculatedDuration !== undefined) {
        dureeField.value = calculatedDuration > 0 ? calculatedDuration.toString() : '';
      }
    }
  }

  // Add methods to determine if we're on the first or last step
  isFirstStep(): boolean {
    return this.currentStep === 0;
  }
  
  isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  // Remove duration field condition from shouldDisplayField since we want to always show it
  shouldDisplayField(field: Field): boolean {
    // Check if nature field has valid value when required
    if (field.name === 'nature' && !field.value) {
      console.warn('Nature field is empty but required');
      return true; // Still show the field
    }
    
    // Existing shouldDisplayField logic...
    if (field.showWhen) {
      const dependentField = this.steps[this.currentStep].fields.find(
        (f: Field) => f.name === field.showWhen?.field
      );
      return dependentField?.value === field.showWhen.value;
    }

    // Special handling for client fields - show if 'autre' selected OR if an existing client is selected
    const clientFields = ['contactNom', 'pays', 'type', 'adresse', 'telephone'];
    if (clientFields.includes(field.name)) {
      const nomClientField = this.steps[this.currentStep].fields.find(
        (f: Field) => f.name === 'nomClient'
      );
      // Show fields if either "autre" is selected OR if a valid existing client is selected
      return nomClientField?.value === 'autre' || this.selectedClientId !== null;
    }

    return true;
  }

  // Add a method to handle adding a team member
  addTeamMember(field: Field, selectedMember: string): void {
    if (!field.selectedValues) {
      field.selectedValues = [];
    }
    
    if (!field.selectedUserIds) {
      field.selectedUserIds = [];
    }
    
    if (selectedMember && !field.selectedValues.includes(selectedMember) && field.userData) {
      const selectedUser = field.userData.find(
        (user: UserDto) => `${user.nom} ${user.prenom}` === selectedMember
      );
      
      if (selectedUser) {
        field.selectedValues.push(selectedMember);
        field.selectedUserIds.push(selectedUser.id);
        console.log('Added team member:', selectedMember, 'with ID:', selectedUser.id);
      }
      
      field.value = ''; // Reset the select dropdown
    }
  }

  // Add a method to handle removing a team member
  removeTeamMember(field: Field, member: string): void {
    if (field.selectedValues) {
      const index = field.selectedValues.indexOf(member);
      if (index > -1) {
        field.selectedValues.splice(index, 1);
        
        // Also remove the user ID at the same index
        if (field.selectedUserIds) {
          field.selectedUserIds.splice(index, 1);
          console.log('Removed team member:', member, 'and associated ID');
        }
      }
    }
  }

  // Add a method to handle adding a bailleur de fonds
  addBailleurFonds(field: Field, selectedBailleur: string): void {
    if (!field.selectedValues) {
      field.selectedValues = [];
    }
    
    if (!field.selectedUserIds) {
      field.selectedUserIds = [];
    }
    
    let bailleurToAdd = selectedBailleur === 'autre' ? field.customValue : selectedBailleur;
    
    if (bailleurToAdd && !field.selectedValues.includes(bailleurToAdd)) {
      const existingBailleur = this.bailleursDeFonds.find(
        bailleur => bailleur.nomBailleur === bailleurToAdd
      );
      
      if (existingBailleur) {
        field.selectedValues.push(bailleurToAdd);
        field.selectedUserIds.push(existingBailleur.id);
        console.log('Added existing bailleur de fonds:', bailleurToAdd, 'with ID:', existingBailleur.id);
      } else if (bailleurToAdd) {
        // Add the custom value to the list immediately
        field.selectedValues.push(bailleurToAdd);
        // We'll assign the ID when the form is submitted
        field.selectedUserIds.push('pending');
        console.log('Added new bailleur de fonds:', bailleurToAdd);
      }
      
      field.value = ''; // Reset the select dropdown
      field.customValue = ''; // Reset the custom value input
    }
  }

  // Add a method to handle removing a bailleur de fonds
  removeBailleurFonds(field: Field, bailleur: string): void {
    if (field.selectedValues) {
      const index = field.selectedValues.indexOf(bailleur);
      if (index > -1) {
        field.selectedValues.splice(index, 1);
        
        if (field.selectedUserIds) {
          field.selectedUserIds.splice(index, 1);
          console.log('Removed bailleur de fonds:', bailleur, 'and associated ID');        }
      }
    }
  }

  loadPartenaires(): void {
    this.isLoadingPartenaires = true;
    this.partenaireService.getPartenaires().subscribe({
      next: (partenaires) => {
        this.partenaires = partenaires;
        this.updatePartenaireFields();
        this.isLoadingPartenaires = false;
      },
      error: (error) => {
        console.error('Error fetching partenaires:', error);
        this.isLoadingPartenaires = false;
      }
    });
  }

  // Add this method to update the partenaire fields
  updatePartenaireFields(): void {
    const partenaireMultiField = this.steps.find((step: Step) => step.title === "Equipe Projet")
      ?.fields.find((field: Field) => field.name === 'partenairesMulti');
    
    if (partenaireMultiField) {
      // Update options with partenaire names from API
      partenaireMultiField.options = this.partenaires.map((partenaire: PartenaireDto) => partenaire.nom || '');
      partenaireMultiField.partenaireData = this.partenaires;
      
      // Initialize arrays if they don't exist
      if (!partenaireMultiField.selectedValues) {
        partenaireMultiField.selectedValues = [];
      }
      if (!partenaireMultiField.selectedPartenaireIds) {
        partenaireMultiField.selectedPartenaireIds = [];
      }
      if (!partenaireMultiField.partenaireDetails) {
        partenaireMultiField.partenaireDetails = {};
      }
    }
  }

  // Add method to handle adding a partenaire
  addPartenaire(field: Field, selectedPartenaireNom: string): void {
    if (!field.selectedValues) {
      field.selectedValues = [];
    }
    
    if (!field.selectedPartenaireIds) {
      field.selectedPartenaireIds = [];
    }
    
    if (!field.partenaireDetails) {
      field.partenaireDetails = {};
    }
    
    let partenaireToAdd = selectedPartenaireNom === 'autre' ? field.customValue : selectedPartenaireNom;
    
    if (partenaireToAdd && !field.selectedValues.includes(partenaireToAdd)) {
      const existingPartenaire = this.partenaires.find(
        partenaire => partenaire.nom === partenaireToAdd
      );
      
      let newPartenaireId = '';
      
      if (existingPartenaire) {
        // Add existing partenaire
        field.selectedValues.push(partenaireToAdd);
        field.selectedPartenaireIds.push(existingPartenaire.id);
        field.partenaireDetails[existingPartenaire.id] = { ...existingPartenaire };
        console.log('Added existing partenaire:', partenaireToAdd, 'with ID:', existingPartenaire.id);
        newPartenaireId = existingPartenaire.id;
      } else if (partenaireToAdd) {
        // Create new partenaire entry
        const newId = 'new_' + Date.now().toString();
        field.selectedValues.push(partenaireToAdd);
        field.selectedPartenaireIds.push(newId);
        field.partenaireDetails[newId] = {
          id: newId,
          nom: partenaireToAdd,
          type: TypePartenaire.Entreprise, // Default type
          domaine: '',
          contactCle: ''
        };
        console.log('Added new partenaire:', partenaireToAdd, 'with temporary ID:', newId);
        newPartenaireId = newId;
      }
        field.value = ''; // Reset the select dropdown
      field.customValue = ''; // Reset the custom value input
      
      // Update the partenaireExists radio button to 'Oui' since we now have partners
      this.updateFieldValue(2, 'partenaireExists', 'Oui');
      
      // Automatically open the edit modal for the newly added partenaire
      // Small timeout to ensure the UI updates first
      setTimeout(() => {
        if (newPartenaireId) {
          this.openPartenaireEditForm(field, newPartenaireId);
        }
      }, 100);
    }
  }
  // Add method to handle removing a partenaire
  removePartenaire(field: Field, partenaireName: string): void {
    if (field.selectedValues) {
      const index = field.selectedValues.indexOf(partenaireName);
      if (index > -1) {
        // Get the ID before removing it from the array
        const partenaireId = field.selectedPartenaireIds?.[index];
        
        // Remove from arrays
        field.selectedValues.splice(index, 1);
        
        if (field.selectedPartenaireIds) {
          field.selectedPartenaireIds.splice(index, 1);
        }
        
        // Remove from details
        if (partenaireId && field.partenaireDetails) {
          delete field.partenaireDetails[partenaireId];
        }
        
        console.log('Removed partenaire:', partenaireName);
        
        // Update the partenaireExists radio button based on remaining partners
        const hasPartners = field.selectedValues.length > 0;
        this.updateFieldValue(2, 'partenaireExists', hasPartners ? 'Oui' : 'Non');
      }
    }
  }

  // Add method to edit a partenaire
  editPartenaire(field: Field, partenaireId: string, updates: Partial<PartenaireDto>): void {
    if (field.partenaireDetails && field.partenaireDetails[partenaireId]) {
      // Update the details object
      field.partenaireDetails[partenaireId] = {
        ...field.partenaireDetails[partenaireId],
        ...updates
      };
      
      // If name has changed, update the selectedValues array too
      if (updates.nom) {
        const index = field.selectedPartenaireIds?.indexOf(partenaireId) ?? -1;
        if (index > -1 && field.selectedValues) {
          field.selectedValues[index] = updates.nom;
        }
      }
      
      console.log('Updated partenaire:', partenaireId, 'with new values:', updates);
    }
  }

  // Add method to get partenaire details
  getPartenaireDetails(field: Field, partenaireId: string): PartenaireDto | undefined {
    return field.partenaireDetails?.[partenaireId];
  }

  // Add methods for the partenaire edit modal
  openPartenaireEditForm(field: Field, partenaireId: string): void {
    if (field.partenaireDetails && field.partenaireDetails[partenaireId]) {
      this.editingPartenaireField = field;
      this.editingPartenaireId = partenaireId;
      this.editingPartenaire = { ...field.partenaireDetails[partenaireId] };
      this.editingCustomDomaine = '';
      
      if (this.editingPartenaire.domaine && !['Cybersécurité', 'Infrastructure', 'Développement', 'Architecture', 'Data Science', 'Intelligence Artificielle', 'Cloud'].includes(this.editingPartenaire.domaine)) {
        this.editingPartenaire.domaine = 'autre';
        this.editingCustomDomaine = field.partenaireDetails[partenaireId].domaine || '';
      }
      
      this.showPartenaireEditModal = true;
    }
  }
  
  closePartenaireEditModal(): void {
    this.showPartenaireEditModal = false;
    this.editingPartenaireField = null;
    this.editingPartenaireId = '';
    this.editingPartenaire = { id: '', type: TypePartenaire.Entreprise };
    this.editingCustomDomaine = '';
  }
  
  savePartenaireChanges(): void {
    if (this.editingPartenaireField && this.editingPartenaireId) {
      // Handle custom domain value if selected
      if (this.editingPartenaire.domaine === 'autre' && this.editingCustomDomaine) {
        this.editingPartenaire.domaine = this.editingCustomDomaine;
      }
      
      // Update the partenaire details
      this.editPartenaire(
        this.editingPartenaireField, 
        this.editingPartenaireId, 
        this.editingPartenaire
      );
      
      this.closePartenaireEditModal();
    }
  }

  // Method to create an empty opportunité and upload the file immediately
  async createEmptyOpportuniteAndUploadFile(file: File): Promise<void> {
    if (!file) return;
    
    try {
      // Validate file type before attempting upload
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx'];
      
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        console.error('Invalid file type:', fileExt);
        alert(`Le type de fichier n'est pas pris en charge. Types autorisés: PDF, DOC, DOCX.`);
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (50MB limit as per backend)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        console.error('File too large:', file.size);
        alert(`Le fichier est trop volumineux. La taille maximale est de 50MB.`);
        this.selectedFile = null;
        return;
      }      
      // Create an empty opportunité with minimal required fields and default values for required fields
      // First, try to get a default client ID if available
      let defaultClientId = '';
      if (this.clients && this.clients.length > 0) {
        defaultClientId = this.clients[0].id;
      }
      
      // Get default user IDs for required roles
      let defaultAssocieId = '';
      if (this.associeUsers && this.associeUsers.length > 0) {
        defaultAssocieId = this.associeUsers[0].id;
      }
      
      let defaultManagerId = '';
      if (this.managerUsers && this.managerUsers.length > 0) {
        defaultManagerId = this.managerUsers[0].id;
      }
      
      // Get default equipe project members
      let defaultEquipeIds: string[] = [];
      if (this.teamUsers && this.teamUsers.length > 0 && this.teamUsers[0].id) {
        defaultEquipeIds = [this.teamUsers[0].id];
      }
        const emptyOpportuniteDto: Omit<OpportuniteDto, 'id'> = {
        nomOpportunite: 'Opportunité temporaire - ' + new Date().toLocaleString(), // Temporary name
        clientId: defaultClientId, // Use default client if available
        partnerExists: false,
        partenaireId: [],
        description: 'Opportunité en cours de création', // Default description
        nature: Nature.AMI, // Default nature
        pays: 'France', // Default country

        bailleurExists: false,
        idBailleurDeFonds: [],
        associeEnCharge: defaultAssocieId, // Use default associé if available
        managerEnCharge: defaultManagerId, // Use default manager if available
        equipeProjet: defaultEquipeIds, // Use default team member if available
        monnaie: 'EUR', // Default currency
        offre: 'e-ID' // Default offer
      };

      console.log('Creating empty opportunité for file upload...');
      const response = await firstValueFrom(this.opportuniteService.createOpportunite(emptyOpportuniteDto));
      
      // Get the opportunité ID from the response
      let opportuniteId = '';
      if (typeof response === 'string') {
        opportuniteId = response;
      } else if (response && response.id) {
        opportuniteId = response.id;
      }
      
      if (!opportuniteId) {
        throw new Error('Failed to create empty opportunité - no ID received');
      }
      
      // Store the ID for later use when submitting the form
      this.createdOpportuniteId = opportuniteId;
      console.log('Empty opportunité created with ID:', opportuniteId);
      // Upload the file immediately
      console.log('Uploading document for opportunité:', opportuniteId);
      try {
        const fileUploadResponse = await firstValueFrom(
          this.opportuniteDocumentService.uploadDocument(opportuniteId, file)
        );
        
        console.log('Document uploaded successfully:', fileUploadResponse);
        this.isFileUploaded = true;
        
        // After successful file upload, get the analysis results
        await this.getAndPopulateAnalysisResults();
        
        // Show success message to user
        alert('Le fichier a été téléchargé avec succès. Les champs ont été pré-remplis en fonction de l\'analyse du document.');
      } catch (uploadError: any) {
        console.error('Error during document upload:', uploadError);
        console.error('Error details:', uploadError.error);
        
        // Handle specific error cases
        if (uploadError.status === 400) {
          alert(`Erreur 400: Le serveur n'a pas pu traiter la demande. ${uploadError.error?.message || uploadError.message || 'Vérifiez le format du fichier.'}`);
        } else if (uploadError.status === 401) {
          alert(`Erreur d'authentification. Veuillez vous reconnecter.`);
        } else {
          alert(`Une erreur s'est produite lors du téléchargement du fichier: ${uploadError.error?.message || uploadError.message || 'Erreur inconnue'}`);
        }
        
        // The opportunité was created but the file upload failed, so we keep the ID
        // but reset the file selection
        this.selectedFile = null;
      }
      
    } catch (error: any) {
      console.error('Error during file processing:', error);
      alert(`Une erreur s'est produite lors du traitement du fichier: ${error.error?.message || error.message || 'Erreur inconnue'}`);
      // Reset file selection if there was an error
      this.selectedFile = null;
    }
  }

  // New method to get analysis results and populate form fields with polling
  async getAndPopulateAnalysisResults(): Promise<void> {
    try {
      this.isLoadingAnalysis = true;
      console.log('Starting to poll for analysis results...');
      
      // Clear any existing polling interval
      this.clearAnalysisPolling();
      
      // Reset polling attempts counter
      this.pollingAttempts = 0;
      
      // First attempt to get results immediately
      try {
        const initialResults = await firstValueFrom(this.analysisResultsService.getAnalysisResults());
        
        // Check if we got valid results with Opportunite data
        if (initialResults && 
            initialResults.results && 
            initialResults.results.Opportunite &&
            initialResults.results.Opportunite.nomOpportunite) {
          console.log('Analysis results available immediately:', initialResults);
          this.populateFieldsFromAnalysis(initialResults);
          this.isLoadingAnalysis = false;
          return;
        }
      } catch (initialError) {
        console.log('No initial results available, will start polling...');
      }
      
      // If we get here, we need to start polling for results
      this.startPollingForAnalysisResults();
      
    } catch (error) {
      console.error('Error in getAndPopulateAnalysisResults:', error);
      this.isLoadingAnalysis = false;
      alert('Une erreur est survenue lors de la récupération des résultats d\'analyse. Veuillez réessayer.');
    }
  }
  
  // Start polling the analysis results endpoint
  startPollingForAnalysisResults(): void {
    this.analysisPollingInterval = setInterval(() => {
      this.pollForAnalysisResults();
    }, 2000); // Poll every 2 seconds
  }
  
  // Clear polling interval
  clearAnalysisPolling(): void {
    if (this.analysisPollingInterval !== null) {
      clearInterval(this.analysisPollingInterval);
      this.analysisPollingInterval = null;
    }
  }
  
  // Poll for analysis results
  async pollForAnalysisResults(): Promise<void> {
    this.pollingAttempts++;
    console.log(`Polling attempt ${this.pollingAttempts}/${this.maxPollingAttempts}`);
    
    try {
      const analysisResults = await firstValueFrom(this.analysisResultsService.getAnalysisResults());
      
      // Check if we have valid results
      if (analysisResults && 
          analysisResults.results && 
          analysisResults.results.Opportunite &&
          analysisResults.results.Opportunite.nomOpportunite) {
        
        console.log('Analysis results received after polling:', analysisResults);
        
        // Stop polling as we got results
        this.clearAnalysisPolling();
        
        // Populate form fields with analysis results
        this.populateFieldsFromAnalysis(analysisResults);
        
        // Update UI state
        this.isLoadingAnalysis = false;
      } else {
        console.log('No valid analysis results yet, continuing to poll...');
      }
    } catch (error) {
      console.error('Error during polling:', error);
    }
    
    // Stop polling if we've reached max attempts
    if (this.pollingAttempts >= this.maxPollingAttempts) {
      console.log('Reached maximum polling attempts, stopping...');
      this.clearAnalysisPolling();
      this.isLoadingAnalysis = false;
      alert('Le traitement du document prend plus de temps que prévu. Les champs n\'ont pas été pré-remplis automatiquement.');
    }
  }
    // Method to populate form fields with analysis results data
  populateFieldsFromAnalysis(analysisResults: AnalysisResultsResponse): void {
    // Focus on opportunite data first as per requirements
    if (!analysisResults.results.Opportunite) {
      console.warn('No Opportunite data in analysis results');
      return;
    }
    
    const opportuniteData = analysisResults.results.Opportunite;
    
    console.log('Populating opportunité fields with data:', opportuniteData);
      // Update the fields in the first step (Informations Générales)
    this.updateFieldValue(0, 'titre', opportuniteData.nomOpportunite);
    this.updateFieldValue(0, 'description', opportuniteData.description);
    this.updateFieldValue(0, 'paysOpportunite', opportuniteData.pays);
    this.updateFieldValue(0, 'dateDebut', opportuniteData.dateDebut);
    this.updateFieldValue(0, 'dateFin', opportuniteData.dateFin);
    this.updateFieldValue(0, 'duree', opportuniteData.duree);
    
    // Handle nature field: convert from string to display name for dropdown
    if (opportuniteData.nature) {
      // The analysis results return nature as a string (e.g., "AMI", "Propale", "Pitch")
      // We need to set this as the display value in the dropdown
      this.updateFieldValue(0, 'nature', opportuniteData.nature);
    }
    
    this.updateFieldValue(0, 'monnaie', opportuniteData.monnaie);
    
    // Update offre field (handle select-or-text type)
    const offreField = this.getField(0, 'offre');
    if (offreField) {
      // Check if the offre value exists in the options
      if (offreField.options && offreField.options.includes(opportuniteData.offre)) {
        offreField.value = opportuniteData.offre;
      } else {
        offreField.value = 'autre';
        offreField.customValue = opportuniteData.offre;
      }
    }
    
    // Update bailleurs exists field in second step
    this.updateFieldValue(1, 'bailleurFondsExists', opportuniteData.bailleurExists ? 'Oui' : 'Non');
    
    // Update partnerExists field in third step
    this.updateFieldValue(2, 'partenaireExists', opportuniteData.partnerExists ? 'Oui' : 'Non');
    
    // Calculate duration if dates are provided but duration is not
    if (opportuniteData.dateDebut && opportuniteData.dateFin && !opportuniteData.duree) {
      this.onDateChange();
    }
    
    // Handle client data if present in the analysis results
    if (analysisResults.results.Client && analysisResults.results.Client.nomClient) {
      console.log('Client data found in analysis results:', analysisResults.results.Client);
      
      // Update the nomClient field in step 1 (Informations Particulières)
      const clientNameField = this.getField(1, 'nomClient');
      if (clientNameField) {
        clientNameField.value = analysisResults.results.Client.nomClient;
      }
      
      // Store the client information with field name mapping (contactClé -> contactNom)
      this.existingClientInfo = {
       
        ...analysisResults.results.Client,
        contactNom: analysisResults.results.Client.contactClé || '' // Map contactClé to contactNom
      };
      
      // Check if at least one important field is not null/empty
      const hasNonNullField = analysisResults.results.Client.contactClé || 
                            analysisResults.results.Client.pays || 
                            analysisResults.results.Client.type || 
                            analysisResults.results.Client.adresse || 
                            analysisResults.results.Client.telephone;
        // Show the client info box whenever client data exists, 
      // regardless of the current step
      if (hasNonNullField) {
        this.showClientInfoBox = true;
        console.log('Client info box visibility set to:', this.showClientInfoBox);
      } else {
        this.showClientInfoBox = false;
      }
    }
  }

  // Helper method to update field value by step index and field name
  private updateFieldValue(stepIndex: number, fieldName: string, value: string | number | boolean | undefined): void {
    if (value === undefined || value === null) return;
    
    const field = this.getField(stepIndex, fieldName);
    if (field) {
      // Convert boolean to 'Oui'/'Non' for radio buttons
      if (typeof value === 'boolean') {
        field.value = value ? 'Oui' : 'Non';
      } else {
        field.value = value.toString();
      }
      console.log(`Updated field ${fieldName} with value:`, field.value);
    } else {
      console.warn(`Field ${fieldName} not found in step ${stepIndex}`);
    }
  }

  // Helper method to get a field by step index and field name
  private getField(stepIndex: number, fieldName: string): Field | undefined {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return undefined;
    }
    
    return this.steps[stepIndex].fields.find(field => field.name === fieldName);
  }

  // For client information box
  showClientInfoBox = false;
  existingClientInfo: any = {};

  hideClientInfoBox(): void {
    this.showClientInfoBox = false;
  }
  fillClientInformation(): void {
    // Fill the client information in the form
    const step = this.steps.find(step => step.title === "Informations Particulières");
    if (step) {
      const clientField = step.fields.find(f => f.name === 'nomClient');
      if (clientField) {
        // Set the value to "autre" for the select field
        clientField.value = 'autre';
        // Set the custom value to the actual client name
        clientField.customValue = this.existingClientInfo.nomClient || '';
      }
      
      // Update other fields from the existing client info
      const updateField = (fieldName: string, value: string) => {
        const field = step.fields.find(f => f.name === fieldName);
        if (field) {
          field.value = value || '';
        }
      };
      
      updateField('contactNom', this.existingClientInfo.contactNom || '');
      updateField('pays', this.existingClientInfo.pays || '');
      updateField('type', this.existingClientInfo.type || '');
      updateField('adresse', this.existingClientInfo.adresse || '');
      updateField('telephone', this.existingClientInfo.telephone || '');
    }
    
    // Hide the box after filling
    this.showClientInfoBox = false;
  }
}