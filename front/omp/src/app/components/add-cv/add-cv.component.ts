import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CvDto } from '../../models/cv.interface';
import { ExperienceDto } from '../../models/experience.interface';
import { FormationDto } from '../../models/formation.interface';
import { ProjetDto } from '../../models/projet.interface';
import { NiveauLangue, normalizeLanguageLevel } from '../../models/niveau-langue.enum';
import { CvService } from '../../services/cv.service';
import { ExperienceService } from '../../services/experience.service';
import { FormationService } from '../../services/formation.service';
import { ProjetService } from '../../services/projet.service';
import { UserService, UserDto } from '../../services/user.service';
import { CvUpdateService } from '../../services/cv-update.service';
import { CvUploadService } from '../../services/cv-upload.service';
import { CvDocumentService } from '../../services/cv-document.service';
import { CvAnalysisResultsService, CvAnalysisResults } from '../../services/cv-analysis-results.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { ConfirmComponent } from '../confirm/confirm.component';
import { DisplayCvComponent } from '../display-cv/display-cv.component';
import { CvAuditLogService } from '../../services/cv-audit-log.service';
import { Operation, ElementsCv } from '../../models/cv-audit-log.interface';
import { AuthService } from '../../services/auth.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, switchMap, finalize, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-add-cv',
  standalone: true,  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    DragDropModule, 
    ClickOutsideDirective,
    MatDialogModule,
    DisplayCvComponent
  ],
  templateUrl: './add-cv.component.html',
  styleUrl: './add-cv.component.css'
})
export class AddCvComponent implements OnInit {
  // Document upload properties
  selectedFile: File | null = null;
  isLoadingAnalysis = false;
  fileUrl: string | null = null;
  fileName: string | null = null;
  
  // CV AI Analysis properties
  isProcessingCV = false;
  folderId = '2b7daf61-a729-4ba4-8b3f-b76907f6e178'; // Default folder ID for processing

  // Form controls
  cvForm!: FormGroup;
  experienceForm!: FormGroup;
  formationForm!: FormGroup;
  langueInlineForm!: FormGroup;
  // Certification inline form 
  certificationInlineForm!: FormGroup;
  editingCertificationIndex: number | null = null;
  
  // Dialog controls
  showExperienceDialog = false;
  showFormationDialog = false;
  showProjetDialog = false;
  editingExperienceIndex: number | null = null;
  editingFormationIndex: number | null = null;
  editingLangueIndex: number | null = null;
  editingProjetIndex: number | null = null;
  projetForm!: FormGroup;
  
  // Experience data
  experiences: ExperienceDto[] = [];
  experienceIdsFromCv: string[] = [];
  loadingExperiences = false;
  
  // Formation data
  formationIdsFromCv: string[] = [];
  formations: FormationDto[] = [];
  loadingFormations = false;
  
  // Language data - dictionary to match CV model format
  languesPratiquees: {[langue: string]: NiveauLangue} = {};
  
  // Domain options for select dropdown
  domaines = ['choix1', 'choix2', 'choix3'];  
  
  // Users array
  users: UserDto[] = [];
    // Loading state
  isLoading = false;
  
  // Audit logging - track initial presentation value
  private initialPresentationValue: string = '';
  
  // Language levels for dropdown
  niveauxLangue = [
    { value: NiveauLangue.Debutant, label: 'Débutant' },
    { value: NiveauLangue.Intermediaire, label: 'Intermédiaire' },
    { value: NiveauLangue.Avance, label: 'Avancé' },
    { value: NiveauLangue.Courant, label: 'Courant' },
    { value: NiveauLangue.Natif, label: 'Natif' }
  ];
  
  // Section icons
  sectionIcons: { [key: string]: string } = {
    experiences: 'fas fa-briefcase',
    formations: 'fas fa-graduation-cap',
    projets: 'fas fa-project-diagram',
    langues: 'fas fa-language',
    certifications: 'fas fa-certificate'
  };

  // Helper method to get language level display text
  getLanguageLevel(niveau: NiveauLangue): string {
    const displayMap = {
      [NiveauLangue.Debutant]: 'Débutant',
      [NiveauLangue.Intermediaire]: 'Intermédiaire',
      [NiveauLangue.Avance]: 'Avancé',
      [NiveauLangue.Courant]: 'Courant',
      [NiveauLangue.Natif]: 'Natif'
    };
    return displayMap[niveau] || 'N/A';
  }

  // Track expanded sections
  expandedSections = {
    experiences: false,
    formations: false,
    projets: false,
    langues: false,
    certifications: false
  };

  // Track perimetre edit and expand states
  perimetreEditModes: boolean[] = [];
  perimetreExpandStates: boolean[] = [];
    constructor(
    private fb: FormBuilder,
    private cvService: CvService,
    private experienceService: ExperienceService,
    private formationService: FormationService,
    private userService: UserService,
    private projetService: ProjetService,
    private cvUpdateService: CvUpdateService,
    private cvUploadService: CvUploadService,
    private cvDocumentService: CvDocumentService,
    private cvAnalysisService: CvAnalysisResultsService,
    private cvAuditLogService: CvAuditLogService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.initLangueInlineForm();
    this.initCertificationInlineForm();
    
    // Highlighting parameters for projects
    let highlightProjectId: string | null = null;
    let highlightKeywords: string = '';
    
    // Check if we're in edit mode (URL has a CV ID parameter)
    this.route.paramMap.subscribe(params => {
      const cvId = params.get('id');
      if (cvId) {
        this.loadCvDetails(cvId);
      }
    });
    
    // Get highlighting query parameters
    this.route.queryParamMap.subscribe(params => {
      highlightProjectId = params.get('highlightProjectId');
      highlightKeywords = params.get('highlightKeywords') || '';
      
      if (highlightProjectId) {
        console.log('Highlighting project with ID:', highlightProjectId);
        
        // Wait for projects to load, then scroll to the highlighted project
        setTimeout(() => {
          this.scrollToProject(highlightProjectId);
        }, 1000);
      }
    });
  }

  // Document upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('File selected:', this.selectedFile.name);
      
      this.isLoadingAnalysis = true;
      
      // Get the current CV ID if we're in edit mode
      const cvId = this.cvForm.get('id')?.value;
      
      // Upload the file using our CvUploadService
      this.cvUploadService.uploadCvDocument(this.selectedFile, cvId)
        .subscribe({
          next: (result) => {
            console.log('CV document uploaded successfully:', result);
            this.isLoadingAnalysis = false;
            
            // Store the file URL from the response
            this.fileUrl = result.fileUrl;
            this.fileName = this.selectedFile?.name || '';
            
            // If this is a new CV, update the form with the new CV ID
            if (!cvId && result.cvId) {
              this.cvForm.patchValue({ id: result.cvId });
              
              // Load the CV details from the server to populate the form
              this.loadCvDetails(result.cvId);
            }
          },
          error: (error) => {
            console.error('Error uploading CV document:', error);
            this.isLoadingAnalysis = false;
            alert('Une erreur est survenue lors du téléchargement du document CV.');
          }
        });
    }
  }

  removeFile(): void {
    // Get the current CV ID
    const cvId = this.cvForm.get('id')?.value;
    
    if (cvId && this.fileName) {
      // Show loading state while deleting
      this.isLoading = true;
      
      // Encode the file name for URL safety
      const encodedFileName = encodeURIComponent(this.fileName);
      
      // Delete the file from Azure Blob storage
      this.cvDocumentService.deleteDocument(cvId, encodedFileName).subscribe({
        next: () => {
          console.log('File removed from storage successfully');
          // Update the CV to remove the document URL reference
          this.fileUrl = null;
          this.fileName = null;
          this.selectedFile = null;
          
          // Update the CV in the database to remove the document reference
          this.updateCvAfterFileRemoval(cvId);
          
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error removing file from storage:', error);
          
          // If the error is 404 (Not Found), it means the file might already be deleted
          // or was never there, so we can still clear the UI
          if (error.status === 404) {
            console.log('File not found in storage, clearing UI references');
            this.updateCvAfterFileRemoval(cvId);
          }
          
          // Still clear the UI even if backend delete fails
          this.fileUrl = null;
          this.fileName = null;
          this.selectedFile = null;
          this.isLoading = false;
        }
      });
    } else {
      // Just clear the file from the UI if it's not yet saved
      this.selectedFile = null;
      this.fileUrl = null;
      this.fileName = null;
    }
  }
  
  // Helper method to update the CV after file removal
  private updateCvAfterFileRemoval(cvId: string): void {
    // Get the current CV data
    const cvData = { ...this.cvForm.getRawValue() };
    
    // Clear the document URL
    cvData.documentUrl = null;
    
    // Update the CV in the database
    this.cvService.updateCv(cvId, cvData).subscribe({
      next: (response) => {
        console.log('CV updated after file removal:', response);
        // Notify other components about the CV update
        this.cvUpdateService.notifyCvUpdated(cvId);
        // Share the updated CV data
        this.cvUpdateService.shareCvData(response);
      },
      error: (error) => {
        console.error('Error updating CV after file removal:', error);
      }
    });
  }

  // Trigger the hidden file input click for "Change file" button
  triggerFileInput(): void {
    const fileInput = document.getElementById('hiddenFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Download the CV document
  downloadFile(): void {
    if (this.fileUrl) {
      // Open the file URL in a new tab
      window.open(this.fileUrl, '_blank');
    } else {
      console.error('No file URL available for download');
      alert('Aucun fichier disponible pour téléchargement.');
    }
  }

  // Process CV with AI analysis
  processCv(): void {
    if (!this.fileName) {
      alert('Veuillez d\'abord télécharger un CV avant de lancer l\'analyse.');
      return;
    }

    this.isProcessingCV = true;
    const cvId = this.cvForm.get('id')?.value || this.folderId;
    
    console.log('Starting CV analysis process with folder ID:', cvId);
    
    // Call the Azure Function to process the CV
    this.cvAnalysisService.processCv(cvId).subscribe({
      next: (response) => {
        console.log('CV analysis processing started successfully:', response);
        
        // Start polling for results
        this.pollForAnalysisResults();
      },
      error: (error) => {
        console.error('Error starting CV analysis:', error);
        
        // More detailed error logging
        if (error.status) {
          console.error(`HTTP Status: ${error.status} ${error.statusText}`);
        }
        
        if (error.error) {
          console.error('Error details:', error.error);
        }
        
        // Show useful error message to the user
        let errorMsg = 'Une erreur est survenue lors du lancement de l\'analyse du CV.';
        
        if (error.status === 0) {
          errorMsg += ' Impossible de se connecter au serveur. Vérifiez que le serveur Azure Functions est démarré.';
        } else if (error.status === 400) {
          errorMsg += ' Requête invalide. Vérifiez le format de l\'ID du dossier.';
        } else if (error.status === 404) {
          errorMsg += ' Point de terminaison non trouvé. Vérifiez l\'URL de l\'API.';
        } else if (error.status === 500) {
          errorMsg += ' Erreur serveur. Vérifiez les journaux du serveur Azure Functions.';
        }
        
        this.isProcessingCV = false;
        alert(errorMsg);
      }
    });
  }

  // Poll for analysis results until completion
  pollForAnalysisResults(): void {
    this.cvAnalysisService.getAnalysisResults().subscribe({
      next: (results) => {
        if (results.status === 'completed') {
          console.log('CV analysis completed successfully:', results);
          this.isProcessingCV = false;
          
          // Apply the analysis results to the form
          this.applyAnalysisResults(results);
        }
      },
      error: (error) => {
        console.error('Error fetching analysis results:', error);
        this.isProcessingCV = false;
        alert('Une erreur est survenue lors de la récupération des résultats de l\'analyse.');
      }
    });
  }

  // Apply analysis results to the form
  applyAnalysisResults(results: CvAnalysisResults): void {
    if (!results.results || !results.results.cv) {
      console.error('Invalid analysis results structure');
      return;
    }

    const cv = results.results.cv;
    
    // Clear existing form data
    this.clearFormData();
    
    // Update user name if provided
    if (cv.nom_user) {
      // Find user by name
      const matchingUser = this.users.find(user => 
        `${user.prenom} ${user.nom}`.toLowerCase() === cv.nom_user.toLowerCase() ||
        `${user.nom} ${user.prenom}`.toLowerCase() === cv.nom_user.toLowerCase()
      );
      
      if (matchingUser) {
        this.cvForm.patchValue({ id_user: matchingUser.id });
      }
    }
      // Update presentation
    if (cv.presentation) {
      this.cvForm.patchValue({ presentation: cv.presentation });
      // Store initial presentation value for audit logging
      this.initialPresentationValue = cv.presentation;
    }
    
    // Add experiences
    if (cv.experiences && cv.experiences.length > 0) {
      cv.experiences.forEach(exp => {
        this.addExperienceFromAnalysis(exp);
      });
    }
    
    // Add formations
    if (cv.formations && cv.formations.length > 0) {
      cv.formations.forEach(formation => {
        this.addFormationFromAnalysis(formation);
      });
    }
    
    // Add languages
    if (cv.languesPratiquees) {
      this.languesPratiquees = {};
      Object.entries(cv.languesPratiquees).forEach(([langue, niveau]) => {
        // Normalize the niveau to ensure compatibility with the enum
        this.languesPratiquees[langue] = normalizeLanguageLevel(niveau as string);
      });
      this.populateLanguesFormArray(this.languesPratiquees);
    }
    
    // Add certifications
    if (cv.certifications && cv.certifications.length > 0) {
      cv.certifications.forEach(certification => {
        const certificationGroup = this.fb.group({
          id: [''],
          nom: [certification, Validators.required]
        });
        this.certificationsArray.push(certificationGroup);
      });
    }
    
    // Add projects
    if (cv.projets && cv.projets.length > 0) {
      cv.projets.forEach(projet => {
        this.addProjetFromAnalysis(projet);
      });
    }
    
    // Auto-save the CV with analyzed data
    setTimeout(() => {
      this.onSubmit();
    }, 500);
  }

  // Helper method to clear form data before applying analysis results
  clearFormData(): void {
    // Clear experiences
    this.experiencesArray.clear();
    this.experiences = [];
    this.experienceIdsFromCv = [];
    
    // Clear formations
    this.formationsArray.clear();
    this.formations = [];
    this.formationIdsFromCv = [];
    
    // Clear languages
    this.languesArray.clear();
    this.languesPratiquees = {};
    
    // Clear certifications
    this.certificationsArray.clear();
    
    // Clear projects
    this.projetsArray.clear();
  }

  // Add experience from analysis results
  addExperienceFromAnalysis(exp: any): void {
    const dateDebut = exp.dateDebut ? new Date(exp.dateDebut) : undefined;
    const dateFin = exp.dateFin && exp.dateFin.trim() !== '' ? new Date(exp.dateFin) : undefined;
    const cvIdValue = this.cvForm.get('id')?.value;
    
    const experienceData: ExperienceDto = {
      id: '',
      employer: exp.employer,
      poste: exp.poste,
      dateDebut: dateDebut,
      dateFin: dateFin,
      cvId: cvIdValue // Populate cvId
    };
      // Save to backend
    this.experienceService.createExperience(experienceData).subscribe({
      next: (createdExperience) => {
        const newExperience = typeof createdExperience === 'string' 
          ? { ...experienceData, id: createdExperience } 
          : createdExperience;
        
        // Create audit log for add operation
        this.createAuditLog(Operation.Add, ElementsCv.Experience);
        
        // Add to UI
        const experienceGroup = this.fb.group({
          id: [newExperience.id],
          employer: [newExperience.employer, Validators.required],
          poste: [newExperience.poste, Validators.required],
          dateDebut: [newExperience.dateDebut, Validators.required],
          dateFin: [newExperience.dateFin],
          isPresent: [!newExperience.dateFin]
        });
        
        // Add logic for isPresent checkbox
        experienceGroup.get('isPresent')?.valueChanges.subscribe(isPresent => {
          const dateFinControl = experienceGroup.get('dateFin');
          if (isPresent) {
            dateFinControl?.disable();
            dateFinControl?.setValue(null);
          } else {
            dateFinControl?.enable();
          }
        });
        
        // Apply the isPresent state
        if (!newExperience.dateFin) {
          experienceGroup.get('dateFin')?.disable();
        }
        
        this.experiencesArray.push(experienceGroup);
        this.experienceIdsFromCv.push(newExperience.id);
        this.experiences.push(newExperience);
      },
      error: (error) => {
        console.error('Error creating experience from analysis:', error);
      }
    });
  }

  // Add formation from analysis results
  addFormationFromAnalysis(formation: any): void {
    const dateDebut = formation.dateDebut ? new Date(formation.dateDebut) : undefined;
    const dateFin = formation.dateFin && formation.dateFin.trim() !== '' ? new Date(formation.dateFin) : undefined;
    const cvIdValue = this.cvForm.get('id')?.value;
    
    const formationData: FormationDto = {
      id: '',
      diplome: formation.diplome,
      institution: formation.institution,
      dateDebut: dateDebut,
      dateFin: dateFin,
      cvId: cvIdValue // Populate cvId
    };
      // Save to backend
    this.formationService.createFormation(formationData).subscribe({
      next: (createdFormation) => {
        const newFormation = typeof createdFormation === 'string' 
          ? { ...formationData, id: createdFormation } 
          : createdFormation;
        
        // Create audit log for add operation
        this.createAuditLog(Operation.Add, ElementsCv.Formation);
        
        // Add to UI
        const formationGroup = this.fb.group({
          id: [newFormation.id],
          diplome: [newFormation.diplome, Validators.required],
          institution: [newFormation.institution, Validators.required],
          dateDebut: [newFormation.dateDebut, Validators.required],
          dateFin: [newFormation.dateFin]
        });
        
        this.formationsArray.push(formationGroup);
        this.formationIdsFromCv.push(newFormation.id);
        this.formations.push(newFormation);
      },
      error: (error) => {
        console.error('Error creating formation from analysis:', error);
      }
    });
  }

  // Add project from analysis results
  addProjetFromAnalysis(projet: any): void {
    const cvIdValue = this.cvForm.get('id')?.value;
    const projetData: ProjetDto = {
      id: '',
      cvId: cvIdValue, // Add this line to include cvId
      nom: projet.nom,
      year: projet.year,
      client: projet.client || '',
      domaine: projet.domaine || '',
      role: projet.role || '',
      perimetre: projet.perimetre || {}
    };
      // Save to backend
    this.projetService.createProjet(projetData).subscribe({
      next: (createdProjet) => {
        console.log('Project created successfully:', createdProjet);
        
        // Create audit log for add operation
        this.createAuditLog(Operation.Add, ElementsCv.Projet);
        
        // Convert response to ProjetDto
        const newProjet = typeof createdProjet === 'string' 
          ? { ...projetData, id: createdProjet } 
          : createdProjet;
        
        // Add to UI with proper form controls
        const projetGroup = this.fb.group({
          id: [newProjet.id],
          nom: [newProjet.nom, Validators.required],
          year: [newProjet.year, Validators.required],
          client: [newProjet.client],
          domaine: [newProjet.domaine, Validators.required],
          role: [newProjet.role, Validators.required],
          hide: [newProjet.hide || false],
          perimetre: [this.convertPerimetreObjectToFormArray(newProjet.perimetre)]
        });
        
        // Add the project to the form array
        this.projetsArray.push(projetGroup);
        
        // Sort projects by year
        const currentProjets = this.projetsArray.controls.map(control => (control as FormGroup).getRawValue());
        const sortedProjets = currentProjets.sort((a, b) => {
          const yearA = a.year ?? 0;
          const yearB = b.year ?? 0;
          return yearB - yearA;
        });
        
        // Clear and repopulate the array in sorted order
        this.projetsArray.clear();
        sortedProjets.forEach(p => {
          const sortedGroup = this.fb.group({
            id: [p.id],
            nom: [p.nom, Validators.required],
            year: [p.year, Validators.required],
            client: [p.client],
            domaine: [p.domaine, Validators.required],
            role: [p.role, Validators.required],
            hide: [p.hide || false],
            perimetre: [p.perimetre]
          });
          this.projetsArray.push(sortedGroup);
        });
      },
      error: (error) => {
        console.error('Error creating project from analysis:', error);
      }
    });
  }

  // Load users from service
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
      }
    });
  }

  initForm(): void {
    this.cvForm = this.fb.group({
      id: [''],
      id_user: ['', Validators.required],
      presentation: ['', Validators.required], // Removed minLength(50) validator
      experiences: this.fb.array([]),
      formations: this.fb.array([]),
      projets: this.fb.array([]),
      langues: this.fb.array([]),
      certifications: this.fb.array([])
    });
  }

  // Initialize the inline language form
  initLangueInlineForm(): void {
    this.langueInlineForm = this.fb.group({
      id: [''],
      langue: ['', Validators.required],
      niveau: [NiveauLangue.Intermediaire, Validators.required]
    });
  }

  // Initialize the inline certification form
  initCertificationInlineForm(): void {
    this.certificationInlineForm = this.fb.group({
      id: [''],
      nom: ['', Validators.required]
    });
  }

  // Helper methods to access form arrays
  get experiencesArray(): FormArray {
    return this.cvForm.get('experiences') as FormArray;
  }

  get formationsArray(): FormArray {
    return this.cvForm.get('formations') as FormArray;
  }

  get projetsArray(): FormArray {
    return this.cvForm.get('projets') as FormArray;
  }

  get languesArray(): FormArray {
    return this.cvForm.get('langues') as FormArray;
  }

  get certificationsArray(): FormArray {
    return this.cvForm.get('certifications') as FormArray;
  }

  // Methods to toggle sections
  toggleSection(section: string): void {
    this.expandedSections[section as keyof typeof this.expandedSections] = 
      !this.expandedSections[section as keyof typeof this.expandedSections];
  }

  // Methods to add new items to each section
  addExperience(): void {
    // Open the dialog immediately to add a new experience
    this.openExperienceDialog();
  }

  addFormation(): void {
    // Open the dialog immediately to add a new formation
    this.openFormationDialog();
  }

  addProjet(): void {
    // Open the dialog to add a new project
    this.openProjetDialog();
  }

  addLangue(): void {
    // Open the dialog immediately to add a new language
    this.openLangueDialog();
  }

  addCertification(): void {
    const certificationGroup = this.fb.group({
      nom: ['', Validators.required]
    });
    this.certificationsArray.push(certificationGroup);
  }
  // Method to remove items from each array
  removeItem(array: FormArray, index: number): void {
    array.removeAt(index);
    // Auto-save the CV after removing an item
    this.onSubmit();
  }

  // Load CV details when in edit mode
  loadCvDetails(cvId: string): void {
    this.isLoading = true;
    this.cvService.getCvById(cvId).subscribe({
      next: (cv) => {
        // Reset the form arrays first
        this.experiencesArray.clear();
        this.formationsArray.clear();
        this.projetsArray.clear();
        this.languesArray.clear();
        this.certificationsArray.clear();
          // Patch the main CV form with the CV data
        this.cvForm.patchValue({
          id: cv.id,
          id_user: cv.id_user,
          presentation: cv.presentation
        });
        
        // Store initial presentation value for audit logging
        this.initialPresentationValue = cv.presentation || '';
        
        // Store the experience IDs for reference
        this.experienceIdsFromCv = cv.experiences || [];
        
        // Load experiences from their IDs
        this.loadExperiencesFromIds();
        
        // Store formation IDs for reference and load formations
        this.formationIdsFromCv = cv.formations || [];
        this.loadFormationsFromIds();
        
        // Load languages if they exist
        if (cv.languesPratiquees) {
          this.languesPratiquees = cv.languesPratiquees;
          this.populateLanguesFormArray(cv.languesPratiquees);
        }
        
        // Load certifications if they exist
        if (cv.certifications && cv.certifications.length > 0) {
          // Add each certification to the form array
          cv.certifications.forEach(certificationName => {
            const certificationGroup = this.fb.group({
              id: [''],
              nom: [certificationName, Validators.required]
            });
            this.certificationsArray.push(certificationGroup);
          });
        }
        
        // Load projects from their IDs if they exist
        if (cv.projets && cv.projets.length > 0) {
          this.loadProjetsFromIds(cv.projets);
        }
        
        // Load file information if it exists
        if (cv.documentUrl) {
          this.fileUrl = cv.documentUrl;
          this.fileName = this.extractFileNameFromUrl(cv.documentUrl);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading CV:', error);
        this.isLoading = false;
        // Navigate back to search if CV not found
        this.router.navigate(['/layout/search-cvs']);
      }
    });
  }

  // Extract file name from URL
  extractFileNameFromUrl(url: string): string {
    if (!url) return '';
    // Get the filename from the URL by taking the text after the last slash
    const parts = url.split('/');
    const fullName = parts[parts.length - 1];
    
    // Handle URL-encoded characters and query parameters
    const queryParamIndex = fullName.indexOf('?');
    return queryParamIndex > 0 
      ? decodeURIComponent(fullName.substring(0, queryParamIndex)) 
      : decodeURIComponent(fullName);
  }

  // Populate the langues form array with loaded languages
  populateLanguesFormArray(languesPratiquees: {[langue: string]: NiveauLangue}): void {
    // Clear the array first
    this.languesArray.clear();
    
    // Add each language to the form array
    Object.entries(languesPratiquees).forEach(([langue, niveau]) => {
      const langueGroup = this.fb.group({
        id: [''], // Languages don't have IDs in the current model
        langue: [langue, Validators.required],
        niveau: [niveau, Validators.required]
      });
      
      this.languesArray.push(langueGroup);
    });
  }

  // Load experiences from IDs stored in the CV
  loadExperiencesFromIds(): void {
    if (!this.experienceIdsFromCv || this.experienceIdsFromCv.length === 0) {
      console.log('No experience IDs to load');
      return;
    }

    this.loadingExperiences = true;
    this.experiences = [];
    
    // Create an array of observables for each experience ID
    const experienceObservables = this.experienceIdsFromCv.map(id => 
      this.experienceService.getExperienceById(id).pipe(
        catchError(error => {
          console.error(`Error fetching experience with ID ${id}:`, error);
          return of(null); // Return null for failed requests
        })
      )
    );
    
    // Execute all observables in parallel using forkJoin
    forkJoin(experienceObservables).subscribe({
      next: (results) => {
        // Filter out nulls (failed requests)
        this.experiences = results.filter(exp => exp !== null) as ExperienceDto[];
        
        // Populate the experiences form array with the loaded experiences
        this.populateExperiencesFormArray();
        
        this.loadingExperiences = false;
      },
      error: (error) => {
        console.error('Error loading experiences:', error);
        this.loadingExperiences = false;
      }
    });
  }
  
  // Populate the experiences form array with loaded experiences
  populateExperiencesFormArray(): void {
    // Clear the array first
    this.experiencesArray.clear();
    
    // Add each experience to the form array
    this.experiences.forEach(experience => {
      const experienceGroup = this.fb.group({
        id: [experience.id],
        employer: [experience.employer, Validators.required],
        poste: [experience.poste, Validators.required],
        dateDebut: [experience.dateDebut, Validators.required],
        dateFin: [experience.dateFin],
        isPresent: [!experience.dateFin] // Set isPresent to true if dateFin is null
      });
      
      // Add the same logic for the isPresent checkbox
      experienceGroup.get('isPresent')?.valueChanges.subscribe(isPresent => {
        const dateFinControl = experienceGroup.get('dateFin');
        if (isPresent) {
          dateFinControl?.disable();
          dateFinControl?.setValue(null);
        } else {
          dateFinControl?.enable();
        }
      });
      
      // Apply the isPresent state
      if (!experience.dateFin) {
        experienceGroup.get('dateFin')?.disable();
      }
      
      this.experiencesArray.push(experienceGroup);
    });
  }

  // Load formations from IDs stored in the CV
  loadFormationsFromIds(): void {
    if (!this.formationIdsFromCv || this.formationIdsFromCv.length === 0) {
      console.log('No formation IDs to load');
      return;
    }

    this.loadingFormations = true;
    this.formations = [];
    
    // Create an array of observables for each formation ID
    const formationObservables = this.formationIdsFromCv.map(id => 
      this.formationService.getFormationById(id).pipe(
        catchError(error => {
          console.error(`Error fetching formation with ID ${id}:`, error);
          return of(null); // Return null for failed requests
        })
      )
    );
    
    // Execute all observables in parallel using forkJoin
    forkJoin(formationObservables).subscribe({
      next: (results) => {
        // Filter out nulls (failed requests)
        this.formations = results.filter(formation => formation !== null) as FormationDto[];
        
        // Populate the formations form array with the loaded formations
        this.populateFormationsFormArray();
        
        this.loadingFormations = false;
      },
      error: (error) => {
        console.error('Error loading formations:', error);
        this.loadingFormations = false;
      }
    });
  }
  
  // Populate the formations form array with loaded formations
  populateFormationsFormArray(): void {
    // Clear the array first
    this.formationsArray.clear();
    
    // Add each formation to the form array
    this.formations.forEach(formation => {
      const formationGroup = this.fb.group({
        id: [formation.id],
        diplome: [formation.diplome, Validators.required],
        institution: [formation.institution, Validators.required],
        dateDebut: [formation.dateDebut, Validators.required],
        dateFin: [formation.dateFin]
      });
      
      this.formationsArray.push(formationGroup);
    });
  }

  // Load projects from IDs stored in the CV
  loadProjetsFromIds(projetIds: string[]): void {
    if (!projetIds || projetIds.length === 0) {
      console.log('No project IDs to load');
      return;
    }

    this.isLoading = true;
    
    // Create an array of observables for each project ID
    const projetObservables = projetIds.map(id => 
      this.projetService.getProjetById(id).pipe(
        catchError(error => {
          console.error(`Error fetching project with ID ${id}:`, error);
          return of(null); // Return null for failed requests
        })
      )
    );
    
    // Execute all observables in parallel using forkJoin
    forkJoin(projetObservables).subscribe({
      next: (results) => {
        // Filter out nulls (failed requests)
        const projets = results.filter(projet => projet !== null) as ProjetDto[];
        
        // Populate the projets form array with the loaded projects
        this.populateProjetsFormArray(projets);
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoading = false;
      }
    });
  }
  
  // Populate the projets form array with loaded projects
  populateProjetsFormArray(projets: ProjetDto[]): void {
    // Clear the array first
    this.projetsArray.clear();
    
    // Sort projects by year in descending order (most recent first)
    const sortedProjets = [...projets].sort((a, b) => {
      const yearA = a.year ?? 0; // Use nullish coalescing to handle undefined
      const yearB = b.year ?? 0;
      return yearB - yearA;
    });

    // Add each project to the form array
    sortedProjets.forEach(projet => {
      const projetGroup = this.fb.group({
        id: [projet.id],
        nom: [projet.nom, Validators.required],
        year: [projet.year, Validators.required],
        client: [projet.client],
        domaine: [projet.domaine, Validators.required],
        role: [projet.role, Validators.required],
        hide: [projet.hide || false], // Added this line to include the hide state
        perimetre: [this.convertPerimetreObjectToFormArray(projet.perimetre)]
      });
      
      this.projetsArray.push(projetGroup);
    });
  }
  
  // Convert perimetre object to form array format for the UI
  convertPerimetreObjectToFormArray(perimetreObj: {[key: string]: string[]} | undefined): any[] {
    if (!perimetreObj) return [];
    
    return Object.entries(perimetreObj).map(([sentence, ramifications]) => ({
      sentence: sentence,
      ramifications: ramifications || []
    }));
  }

  // Submit form
  onSubmit(): void {
    if (this.cvForm.valid) {
      console.log('CV form submitted:', this.cvForm.value);
      this.isLoading = true;
      
      // Create a clean CV data object that strictly follows the CvDto interface
      const cvData: CvDto = {
        id: this.cvForm.get('id')?.value || '',
        id_user: this.cvForm.get('id_user')?.value,
        presentation: this.cvForm.get('presentation')?.value,
        documentUrl: this.fileUrl || undefined,
        experiences: this.experienceIdsFromCv,
        formations: this.formationIdsFromCv,
        projets: this.projetsArray.controls
          .map(control => (control as FormGroup).get('id')?.value)
          .filter(id => id) as string[]
      };
      
      // Handle languesPratiquees separately to ensure proper typing
      const cleanLangues: { [key: string]: NiveauLangue } = {};
      this.languesArray.controls.forEach((control) => {
        const langueGroup = control as FormGroup;
        const langue = langueGroup.get('langue')?.value;
        const niveau = langueGroup.get('niveau')?.value;
        if (langue && niveau && Object.values(NiveauLangue).includes(niveau)) {
          cleanLangues[langue] = niveau;
        }
      });
      cvData.languesPratiquees = cleanLangues;
      
      // Handle certifications
      cvData.certifications = this.certificationsArray.controls
        .map(control => (control as FormGroup).get('nom')?.value)
        .filter(name => name) as string[];

      console.log('Sending CV data to API:', JSON.stringify(cvData));
      
      // Determine if this is an update or a new CV
      if (cvData.id) {        // Update existing CV
        this.cvService.updateCv(cvData.id, cvData).subscribe({
          next: (response) => {
            this.isLoading = false;
            console.log('CV updated successfully:', response);
            
            // Check if presentation has changed and create audit log
            const currentPresentationValue = this.cvForm.get('presentation')?.value || '';
            if (currentPresentationValue !== this.initialPresentationValue) {
              // Log the change
              this.createAuditLog(Operation.Edit, ElementsCv.Presentation);
              // Update the initial value to the current value
              this.initialPresentationValue = currentPresentationValue;
            }
            
            // Notify other components about the CV update
            this.cvUpdateService.notifyCvUpdated(cvData.id);
            // Share the updated CV data
            this.cvUpdateService.shareCvData(response);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating CV:', error);
            // Log detailed validation errors if available
            if (error.error && error.error.errors) {
              console.error('Validation errors:', error.error.errors);
              // Display error message to user
              alert('Erreur de validation. Veuillez vérifier les données du formulaire.');
            }
          }
        });
      } else {
        // Create new CV
        this.cvService.createCv(cvData).subscribe({
          next: (response) => {
            this.isLoading = false;
            console.log('CV saved successfully:', response);
            
            // If the response is a string (ID), we need to fetch the CV
            if (typeof response === 'string') {
              const newCvId = response;
              // Update the form with the new ID
              this.cvForm.patchValue({ id: newCvId });
              
              // Notify other components about the new CV
              this.cvUpdateService.notifyCvUpdated(newCvId);
              
              // Fetch the complete CV object to share with other components
              this.cvService.getCvById(newCvId).subscribe(cv => {
                this.cvUpdateService.shareCvData(cv);
              });
            } else {
              // If the response is the complete CV object
              this.cvForm.patchValue({ id: response.id });
              
              // Notify other components about the new CV
              this.cvUpdateService.notifyCvUpdated(response.id);
              // Share the new CV data
              this.cvUpdateService.shareCvData(response);
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error saving CV:', error);
            // Log detailed validation errors if available
            if (error.error && error.error.errors) {
              console.error('Validation errors:', error.error.errors);
              // Display error message to user
              alert('Erreur de validation. Veuillez vérifier les données du formulaire.');
            }
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.cvForm);
    }
  }
  
  // Navigate to search-cvs component
  navigateToSearchCvs(): void {
    this.router.navigate(['/layout/search-cvs']);
  }

  // Helper to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Edit specific item in modal
  editItem(type: string, index: number): void {
    if (type === 'experience') {
      this.openExperienceDialog(index);
    } else if (type === 'formation') {
      this.openFormationDialog(index);
    } else if (type === 'langue') {
      this.openLangueDialog(index);
    } else if (type === 'projet') {
      this.openProjetDialog(index);
    } else {
      console.log(`Editing ${type} at index ${index}`);
      // In a real app, you would open a modal for editing
    }
  }

  // Experience Dialog Methods
  openExperienceDialog(index: number | null = null): void {
    // Initialize experience form
    this.experienceForm = this.fb.group({
      id: [''],
      employer: ['', Validators.required],
      poste: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: [''],
      isPresent: [false]
    });
    
    // Add the same logic for the isPresent checkbox in the dialog form
    this.experienceForm.get('isPresent')?.valueChanges.subscribe(isPresent => {
      const dateFinControl = this.experienceForm.get('dateFin');
      if (isPresent) {
        dateFinControl?.disable();
        dateFinControl?.setValue(null);
      } else {
        dateFinControl?.enable();
      }
    });

    this.editingExperienceIndex = index;
    
    // If editing an existing experience, populate the form
    if (index !== null) {
      const experience = (this.experiencesArray.at(index) as FormGroup).getRawValue();
      
      // Extract year from dateDebut and dateFin if they are Date objects
      let debutYear = '';
      let finYear = '';
      
      if (experience.dateDebut) {
        // Handle both Date objects and year numbers
        if (experience.dateDebut instanceof Date) {
          debutYear = experience.dateDebut.getFullYear().toString();
        } else if (typeof experience.dateDebut === 'string' && experience.dateDebut.includes('-')) {
          // Handle ISO date string format
          debutYear = new Date(experience.dateDebut).getFullYear().toString();
        } else {
          debutYear = experience.dateDebut.toString();
        }
      }
      
      if (experience.dateFin) {
        // Handle both Date objects and year numbers
        if (experience.dateFin instanceof Date) {
          finYear = experience.dateFin.getFullYear().toString();
        } else if (typeof experience.dateFin === 'string' && experience.dateFin.includes('-')) {
          // Handle ISO date string format
          finYear = new Date(experience.dateFin).getFullYear().toString();
        } else {
          finYear = experience.dateFin.toString();
        }
      }
      
      this.experienceForm.patchValue({
        id: experience.id,
        employer: experience.employer,
        poste: experience.poste,
        dateDebut: debutYear,
        dateFin: finYear,
        isPresent: experience.isPresent
      });
      
      // Make sure to apply the isPresent logic for existing experiences
      if (experience.isPresent) {
        this.experienceForm.get('dateFin')?.disable();
      }
    }
    
    this.showExperienceDialog = true;
  }

  closeExperienceDialog(): void {
    this.showExperienceDialog = false;
    this.editingExperienceIndex = null;
  }  saveExperience(): void {
    if (this.experienceForm.valid) {
      const formData = this.experienceForm.getRawValue();
      
      // Convert year numbers to proper Date objects
      const dateDebut = formData.dateDebut ? new Date(parseInt(formData.dateDebut.toString()), 0, 1) : undefined;
      const dateFin = formData.dateFin && !formData.isPresent ? new Date(parseInt(formData.dateFin.toString()), 0, 1) : undefined;
      
      // Ensure CV exists before creating experience
      this.ensureCvExists().subscribe({
        next: (cvId: string) => {
          const experienceData: ExperienceDto = {
            id: formData.id || '',
            employer: formData.employer,
            poste: formData.poste,
            dateDebut: dateDebut,
            dateFin: dateFin,
            cvId: cvId
          };
          
          // Determine if this is an edit or add operation
          const isEdit = !!experienceData.id;
          
          // Save to backend
          if (experienceData.id) {
            // Update existing experience
            this.experienceService.updateExperience(experienceData.id, experienceData).subscribe({
              next: (updatedExperience) => {
                console.log('Experience updated successfully:', updatedExperience);
                
                // Create audit log for edit operation
                this.createAuditLog(Operation.Edit, ElementsCv.Experience);
                
                // Update the form in the UI
                if (this.editingExperienceIndex !== null) {
                  const experienceGroup = this.fb.group({
                    id: [updatedExperience.id],
                    employer: [updatedExperience.employer, Validators.required],
                    poste: [updatedExperience.poste, Validators.required],
                    dateDebut: [updatedExperience.dateDebut, Validators.required],
                    dateFin: [updatedExperience.dateFin],
                    isPresent: [!updatedExperience.dateFin]
                  });
                  
                  this.experiencesArray.setControl(this.editingExperienceIndex, experienceGroup);
                }
                
                this.closeExperienceDialog();
                // Auto-save the CV
                this.onSubmit();
              },
              error: (error) => {
                console.error('Error updating experience:', error);
              }
            });
          } else {
            // Add new experience
            this.experienceService.createExperience(experienceData).subscribe({
              next: (createdExperience) => {
                console.log('Experience created successfully:', createdExperience);
                
                // Create audit log for add operation
                this.createAuditLog(Operation.Add, ElementsCv.Experience);
                
                const newExperience = typeof createdExperience === 'string' 
                  ? { ...experienceData, id: createdExperience } 
                  : createdExperience;
                
                const experienceGroup = this.fb.group({
                  id: [newExperience.id],
                  employer: [newExperience.employer, Validators.required],
                  poste: [newExperience.poste, Validators.required],
                  dateDebut: [newExperience.dateDebut, Validators.required],
                  dateFin: [newExperience.dateFin],
                  isPresent: [!newExperience.dateFin]
                });
                
                this.experiencesArray.push(experienceGroup);
                this.experienceIdsFromCv.push(newExperience.id);
                this.experiences.push(newExperience);
                
                this.closeExperienceDialog();
                // Auto-save the CV
                this.onSubmit();
              },
              error: (error) => {
                console.error('Error creating experience:', error);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error ensuring CV exists:', error);
        }
      });
    }
  }
  // Delete an experience
  deleteExperience(index: number): void {
    if (index < 0 || index >= this.experiencesArray.length) {
      console.error('Invalid experience index');
      return;
    }
    
    const experienceGroup = this.experiencesArray.at(index) as FormGroup;
    const experienceId = experienceGroup.get('id')?.value;
    
    if (!experienceId) {
      console.error('Experience ID not found');
      return;
    }
    
    // Show confirmation dialog or directly proceed with deletion
    if (confirm('Êtes-vous sûr de vouloir supprimer cette expérience ?')) {
      this.experienceService.deleteExperience(experienceId).subscribe({
        next: () => {
          console.log('Experience deleted successfully');
          
          // Create audit log for delete operation
          this.createAuditLog(Operation.Delete, ElementsCv.Experience);
          
          // Remove from the form array
          this.experiencesArray.removeAt(index);
          
          // Remove from the experiences list
          this.experiences = this.experiences.filter(exp => exp.id !== experienceId);
          
          // Remove from the experienceIdsFromCv array
          const idIndex = this.experienceIdsFromCv.indexOf(experienceId);
          if (idIndex !== -1) {
            this.experienceIdsFromCv.splice(idIndex, 1);
          }
          
          // Auto-save the CV after deleting an experience
          this.onSubmit();
        },
        error: (error) => {
          console.error('Error deleting experience:', error);
        }
      });
    }
  }

  // Formation Dialog Methods
  openFormationDialog(index: number | null = null): void {
    // Initialize formation form
    this.formationForm = this.fb.group({
      id: [''],
      diplome: ['', Validators.required],
      institution: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['']
    });

    this.editingFormationIndex = index;
    
    // If editing an existing formation, populate the form
    if (index !== null) {
      const formation = (this.formationsArray.at(index) as FormGroup).getRawValue();
      
      // Extract year from dateDebut and dateFin if they are Date objects
      let debutYear = '';
      let finYear = '';
      
      if (formation.dateDebut) {
        // Handle both Date objects and year numbers
        if (formation.dateDebut instanceof Date) {
          debutYear = formation.dateDebut.getFullYear().toString();
        } else if (typeof formation.dateDebut === 'string' && formation.dateDebut.includes('-')) {
          // Handle ISO date string format
          debutYear = new Date(formation.dateDebut).getFullYear().toString();
        } else {
          debutYear = formation.dateDebut.toString();
        }
      }
      
      if (formation.dateFin) {
        // Handle both Date objects and year numbers
        if (formation.dateFin instanceof Date) {
          finYear = formation.dateFin.getFullYear().toString();
        } else if (typeof formation.dateFin === 'string' && formation.dateFin.includes('-')) {
          // Handle ISO date string format
          finYear = new Date(formation.dateFin).getFullYear().toString();
        } else {
          finYear = formation.dateFin.toString();
        }
      }
      
      this.formationForm.patchValue({
        id: formation.id,
        diplome: formation.diplome,
        institution: formation.institution,
        dateDebut: debutYear,
        dateFin: finYear
      });
    }
    
    this.showFormationDialog = true;
  }

  closeFormationDialog(): void {
    this.showFormationDialog = false;
    this.editingFormationIndex = null;
  }

  saveFormation(): void {
    if (this.formationForm.valid) {
      const formData = this.formationForm.getRawValue();
      
      // Convert year numbers to proper Date objects
      const dateDebut = formData.dateDebut ? new Date(parseInt(formData.dateDebut.toString()), 0, 1) : undefined;
      const dateFin = formData.dateFin ? new Date(parseInt(formData.dateFin.toString()), 0, 1) : undefined;
      
      // Ensure CV exists before creating formation
      this.ensureCvExists().subscribe({
        next: (cvId: string) => {
          const formationData: FormationDto = {
            id: formData.id || '',
            diplome: formData.diplome,
            institution: formData.institution,
            dateDebut: dateDebut,
            dateFin: dateFin,
            cvId: cvId
          };
          
          // Save to backend
          if (formationData.id) {            // Update existing formation
            this.formationService.updateFormation(formationData.id, formationData).subscribe({
              next: (updatedFormation) => {
                console.log('Formation updated successfully:', updatedFormation);
                
                // Create audit log for edit operation
                this.createAuditLog(Operation.Edit, ElementsCv.Formation);
                
                // Update the form in the UI
                if (this.editingFormationIndex !== null) {
                  const formationGroup = this.fb.group({
                    id: [updatedFormation.id],
                    diplome: [updatedFormation.diplome, Validators.required],
                    institution: [updatedFormation.institution, Validators.required],
                    dateDebut: [updatedFormation.dateDebut, Validators.required],
                    dateFin: [updatedFormation.dateFin]
                  });
                  
                  this.formationsArray.setControl(this.editingFormationIndex, formationGroup);
                }
                
                this.closeFormationDialog();
                // Auto-save the CV
                this.onSubmit();
              },
              error: (error) => {
                console.error('Error updating formation:', error);
              }
            });
          } else {            // Add new formation
            this.formationService.createFormation(formationData).subscribe({
              next: (createdFormation) => {
                console.log('Formation created successfully:', createdFormation);
                
                // Create audit log for add operation
                this.createAuditLog(Operation.Add, ElementsCv.Formation);
                
                const newFormation = typeof createdFormation === 'string' 
                  ? { ...formationData, id: createdFormation } 
                  : createdFormation;
                
                const formationGroup = this.fb.group({
                  id: [newFormation.id],
                  diplome: [newFormation.diplome, Validators.required],
                  institution: [newFormation.institution, Validators.required],
                  dateDebut: [newFormation.dateDebut, Validators.required],
                  dateFin: [newFormation.dateFin]
                });
                
                this.formationsArray.push(formationGroup);
                this.formationIdsFromCv.push(newFormation.id);
                this.formations.push(newFormation);
                
                this.closeFormationDialog();
                // Auto-save the CV
                this.onSubmit();
              },
              error: (error) => {
                console.error('Error creating formation:', error);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error ensuring CV exists:', error);
        }
      });
    }
  }

  // Delete a formation
  deleteFormation(index: number): void {
    if (index < 0 || index >= this.formationsArray.length) {
      console.error('Invalid formation index');
      return;
    }
    
    const formationGroup = this.formationsArray.at(index) as FormGroup;
    const formationId = formationGroup.get('id')?.value;
    
    if (!formationId) {
      console.error('Formation ID not found');
      return;
    }
    
    // Show confirmation dialog or directly proceed with deletion
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {      this.formationService.deleteFormation(formationId).subscribe({
        next: () => {
          console.log('Formation deleted successfully');
          
          // Create audit log for delete operation
          this.createAuditLog(Operation.Delete, ElementsCv.Formation);
          
          // Remove from the form array
          this.formationsArray.removeAt(index);
          
          // Remove from the formations list
          this.formations = this.formations.filter(formation => formation.id !== formationId);
          
          // Remove from the formationIdsFromCv array
          const idIndex = this.formationIdsFromCv.indexOf(formationId);
          if (idIndex !== -1) {
            this.formationIdsFromCv.splice(idIndex, 1);
          }
          
          // Auto-save the CV after deleting formation
          this.onSubmit();
        },
        error: (error) => {
          console.error('Error deleting formation:', error);
        }
      });
    }
  }

  // Langue Dialog Methods
  openLangueDialog(index: number | null = null): void {
    // Initialize language form
    this.langueInlineForm = this.fb.group({
      id: [''],
      langue: ['', Validators.required],
      niveau: [NiveauLangue.Intermediaire, Validators.required]
    });

    this.editingLangueIndex = index;
    
    // If editing an existing language, populate the form
    if (index !== null) {
      const langue = (this.languesArray.at(index) as FormGroup).getRawValue();
      this.langueInlineForm.patchValue({
        id: langue.id,
        langue: langue.langue,
        niveau: langue.niveau
      });
    }
  }

  saveLangue(): void {
    if (this.langueInlineForm.valid) {
      const formData = this.langueInlineForm.getRawValue();
      
      if (this.editingLangueIndex !== null) {
        // Update existing language
        const langueGroup = this.languesArray.at(this.editingLangueIndex) as FormGroup;
        langueGroup.patchValue(formData);
      } else {
        // Add new language
        const langueGroup = this.fb.group({
          id: formData.id,
          langue: [formData.langue, Validators.required],
          niveau: [formData.niveau, Validators.required]
        });
        
        this.languesArray.push(langueGroup);
      }
    }
  }

  // Inline language form methods
  editLangueInline(index: number): void {
    this.editingLangueIndex = index;
    const langue = (this.languesArray.at(index) as FormGroup).getRawValue();
    this.langueInlineForm.patchValue({
      id: langue.id,
      langue: langue.langue,
      niveau: langue.niveau
    });
  }

  cancelEditLangue(): void {
    this.editingLangueIndex = null;
    this.langueInlineForm.reset();
    this.langueInlineForm.patchValue({
      id: '',
      langue: '',
      niveau: ''
    });
  }
  saveLangueInline(): void {
    if (this.langueInlineForm.valid) {
      const formData = this.langueInlineForm.getRawValue();
      
      if (this.editingLangueIndex !== null) {
        // Get the current language key before updating
        const langueGroup = this.languesArray.at(this.editingLangueIndex) as FormGroup;
        const oldLangueKey = langueGroup.get('langue')?.value;
        
        // If the language name changed, remove the old entry from the dictionary
        if (oldLangueKey && oldLangueKey !== formData.langue) {
          delete this.languesPratiquees[oldLangueKey];
        }
        
        // Add or update in the languesPratiquees dictionary
        this.languesPratiquees[formData.langue] = formData.niveau;
        
        // Update the existing language in the form array
        langueGroup.patchValue(formData);
        this.editingLangueIndex = null;
        
        // Create audit log for edit operation
        this.createAuditLog(Operation.Edit, ElementsCv.Langue);
      } else {
        // Add new language to the languesPratiquees dictionary
        this.languesPratiquees[formData.langue] = formData.niveau;
        
        // Add new language to the form array
        const langueGroup = this.fb.group({
          id: formData.id,
          langue: [formData.langue, Validators.required],
          niveau: [formData.niveau, Validators.required]
        });
        
        this.languesArray.push(langueGroup);
        
        // Create audit log for add operation
        this.createAuditLog(Operation.Add, ElementsCv.Langue);
      }
      
      // Reset the form
      this.langueInlineForm.reset();
      this.langueInlineForm.patchValue({
        id: '',
        langue: '',
        niveau: NiveauLangue.Intermediaire
      });
      
      // Auto-save the CV
      this.onSubmit();
    }
  }
  // Delete a language
  deleteLangue(index: number): void {
    if (index < 0 || index >= this.languesArray.length) {
      console.error('Invalid language index');
      return;
    }
    
    const langueGroup = this.languesArray.at(index) as FormGroup;
    const langue = langueGroup.get('langue')?.value;
    
    if (langue) {
      // Remove from the languesPratiquees dictionary
      if (this.languesPratiquees[langue]) {
        delete this.languesPratiquees[langue];
      }
      
      // Remove from the form array
      this.languesArray.removeAt(index);
      
      // Create audit log for delete operation
      this.createAuditLog(Operation.Delete, ElementsCv.Langue);
      
      // Auto-save the CV after deleting a language
      this.onSubmit();
    }
  }

  // Inline certification form methods
  editCertificationInline(index: number): void {
    this.editingCertificationIndex = index;
    const certification = (this.certificationsArray.at(index) as FormGroup).getRawValue();
    this.certificationInlineForm.patchValue({
      id: certification.id,
      nom: certification.nom
    });
  }

  cancelEditCertification(): void {
    this.editingCertificationIndex = null;
    this.certificationInlineForm.reset();
    this.certificationInlineForm.patchValue({
      id: '',
      nom: ''
    });
  }
  saveCertificationInline(): void {
    if (this.certificationInlineForm.valid) {
      const formData = this.certificationInlineForm.getRawValue();
      
      if (this.editingCertificationIndex !== null) {
        // Update existing certification
        const certificationGroup = this.certificationsArray.at(this.editingCertificationIndex) as FormGroup;
        certificationGroup.patchValue(formData);
        this.editingCertificationIndex = null;
        
        // Create audit log for edit operation
        this.createAuditLog(Operation.Edit, ElementsCv.Certification);
      } else {
        // Add new certification
        const certificationGroup = this.fb.group({
          id: formData.id,
          nom: [formData.nom, Validators.required]
        });
        
        this.certificationsArray.push(certificationGroup);
        
        // Create audit log for add operation
        this.createAuditLog(Operation.Add, ElementsCv.Certification);
      }
      
      // Reset the form
      this.certificationInlineForm.reset();
      this.certificationInlineForm.patchValue({
        id: '',
        nom: ''
      });
      
      // Auto-save the CV after adding or updating a certification
      this.onSubmit();
    }
  }
  // Delete a certification
  deleteCertification(index: number): void {
    if (index < 0 || index >= this.certificationsArray.length) {
      console.error('Invalid certification index');
      return;
    }
    
    // Remove from the form array
    this.certificationsArray.removeAt(index);
    
    // Create audit log for delete operation
    this.createAuditLog(Operation.Delete, ElementsCv.Certification);
    
    // Auto-save the CV after deleting a certification
    this.onSubmit();
  }

  // Project Dialog Methods
  openProjetDialog(index: number | null = null): void {
    // Initialize project form
    this.projetForm = this.fb.group({
      id: [''],
      nom: ['', Validators.required],
      year: ['', Validators.required],
      client: [''],
      domaine: ['', Validators.required],
      role: ['', Validators.required],
      // Add perimetre sentences and ramifications control
      perimetre: this.fb.array([]),
    });

    this.editingProjetIndex = index;
    
    // If editing an existing project, populate the form
    if (index !== null) {
      const projet = (this.projetsArray.at(index) as FormGroup).getRawValue();
      this.projetForm.patchValue({
        id: projet.id,
        nom: projet.nom,
        year: projet.year,
        client: projet.client,
        domaine: projet.domaine,
        role: projet.role
      });
      
      // Handle perimetre if it exists
      if (projet.perimetre && Array.isArray(projet.perimetre)) {
        projet.perimetre.forEach((p: any) => {
          this.addPerimetreToForm(p.sentence, p.ramifications);
        });
      }
    }
    
    this.showProjetDialog = true;
  }

  // Helper getter for the perimetre form array
  get perimetreArray(): FormArray {
    return this.projetForm.get('perimetre') as FormArray;
  }

  // Add a new perimetre group to the form
  addPerimetreToForm(sentence: string = '', ramifications: string[] = []): void {
    const perimetreGroup = this.fb.group({
      sentence: [sentence, Validators.required],
      ramifications: this.fb.array(
        ramifications.map(r => this.fb.control(r, Validators.required))
      )
    });
    
    this.perimetreArray.push(perimetreGroup);
  }

  // Get ramifications array for a specific perimetre
  getRamificationsArray(index: number): FormArray {
    return (this.perimetreArray.at(index) as FormGroup).get('ramifications') as FormArray;
  }

  // Add a new ramification to a specific perimetre
  addRamification(perimetreIndex: number, value: string = ''): void {
    // Check if there's already an empty ramification
    if (this.hasEmptyRamification(perimetreIndex)) {
      return; // Don't add a new one if there's already an empty one
    }
    
    const ramificationsArray = this.getRamificationsArray(perimetreIndex);
    ramificationsArray.push(this.fb.control(value, Validators.required));
    
    // When adding a ramification, keep the perimetre in edit mode
    this.ensurePerimetreArraysSize();
    this.perimetreEditModes[perimetreIndex] = true;
  }

  // Check if there's an empty ramification in the specified perimetre
  hasEmptyRamification(perimetreIndex: number): boolean {
    const ramificationsArray = this.getRamificationsArray(perimetreIndex);
    
    for (let i = 0; i < ramificationsArray.length; i++) {
      const ramification = ramificationsArray.at(i).value;
      if (!ramification || ramification.trim() === '') {
        return true;
      }
    }
    
    return false;
  }

  // Remove a ramification from a specific perimetre
  removeRamification(perimetreIndex: number, ramificationIndex: number): void {
    const ramificationsArray = this.getRamificationsArray(perimetreIndex);
    ramificationsArray.removeAt(ramificationIndex);
  }

  // Add a new empty perimetre with one empty ramification
  addPerimetre(): void {
    // Check if there's already an open and empty perimetre
    if (this.hasEmptyEditedPerimetre()) {
      return; // Don't add a new one if there's already an empty edited one
    }
    
    this.addPerimetreToForm();
    // Add at least one empty ramification
    this.addRamification(this.perimetreArray.length - 1);
    
    // Set this new perimetre to edit mode
    const newIndex = this.perimetreArray.length - 1;
    this.ensurePerimetreArraysSize();
    this.perimetreEditModes[newIndex] = true;
    
    // Ensure all other perimetres with valid content are in display mode
    for (let i = 0; i < this.perimetreArray.length - 1; i++) {
      this.onPerimetreBlur(i);
    }
  }

  // Check if there's an open and empty perimetre edit form
  hasEmptyEditedPerimetre(): boolean {
    for (let i = 0; i < this.perimetreArray.length; i++) {
      if (this.perimetreEditModes[i]) {
        const perimetreGroup = this.perimetreArray.at(i) as FormGroup;
        const sentence = perimetreGroup.get('sentence')?.value;
        const ramificationsArray = this.getRamificationsArray(i);
        
        // Check if the sentence is empty or if all ramifications are empty
        if (!sentence || sentence.trim() === '') {
          return true;
        }
        
        let allRamificationsEmpty = true;
        for (let j = 0; j < ramificationsArray.length; j++) {
          const ramification = ramificationsArray.at(j).value;
          if (ramification && ramification.trim() !== '') {
            allRamificationsEmpty = false;
            break;
          }
        }
        
        if (allRamificationsEmpty && ramificationsArray.length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  // Ensure arrays for tracking perimetre states are the right size
  ensurePerimetreArraysSize(): void {
    const perimetreCount = this.perimetreArray.length;
    
    // Resize edit modes array
    while (this.perimetreEditModes.length < perimetreCount) {
      this.perimetreEditModes.push(true); // New perimetres start in edit mode
    }
    this.perimetreEditModes = this.perimetreEditModes.slice(0, perimetreCount);
    
    // Resize expand states array
    while (this.perimetreExpandStates.length < perimetreCount) {
      this.perimetreExpandStates.push(false);
    }
    this.perimetreExpandStates = this.perimetreExpandStates.slice(0, perimetreCount);
  }

  // Toggle perimetre edit mode
  togglePerimetreEditMode(index: number): void {
    this.ensurePerimetreArraysSize();
    this.perimetreEditModes[index] = !this.perimetreEditModes[index];
  }

  // Toggle perimetre expand state
  togglePerimetreExpand(index: number, event: Event): void {
    event.stopPropagation(); // Prevent this from affecting parent elements
    this.ensurePerimetreArraysSize();
    this.perimetreExpandStates[index] = !this.perimetreExpandStates[index];
  }

  // Handle blur event for perimetre sentence
  onPerimetreBlur(index: number): void {
    // Check if the perimetre is valid before turning it into display mode
    const perimetreGroup = this.perimetreArray.at(index) as FormGroup;
    const ramificationsArray = this.getRamificationsArray(index);
    
    // Only switch to display mode if the sentence is valid and 
    // there is at least one ramification with content
    if (perimetreGroup.get('sentence')?.valid && ramificationsArray.length > 0) {
      // Check if at least one ramification has content
      let hasValidRamification = false;
      for (let i = 0; i < ramificationsArray.length; i++) {
        if (ramificationsArray.at(i).value && ramificationsArray.at(i).valid) {
          hasValidRamification = true;
          break;
        }
      }
      
      // Don't switch to display mode if the last ramification is empty
      // This prevents the form from switching to display mode when a new ramification is added
      const lastRamification = ramificationsArray.length > 0 ? 
        ramificationsArray.at(ramificationsArray.length - 1).value : null;
      
      if (hasValidRamification && lastRamification && lastRamification.trim() !== '') {
        this.ensurePerimetreArraysSize();
        this.perimetreEditModes[index] = false;
      }
    }
  }
  
  // Handle blur event on a ramification field
  onRamificationBlur(perimetreIndex: number, ramificationIndex: number): void {
    // Don't do anything that would affect the edit mode
    // This is intentionally empty to prevent the form from switching to display mode
    // when clicking "Ajouter" for a new ramification
  }

  // Set a specific perimetre to edit mode
  editPerimetre(index: number, event: Event): void {
    event.stopPropagation(); // Prevent any parent click handlers from firing
    this.ensurePerimetreArraysSize();
    this.perimetreEditModes[index] = true;
  }

  // Remove a perimetre
  removePerimetre(index: number): void {
    this.perimetreArray.removeAt(index);
    this.perimetreEditModes.splice(index, 1);
    this.perimetreExpandStates.splice(index, 1);
  }

  // Handle click outside the périmètre edit mode
  handleClickOutside(perimetreIndex: number): void {
    // Only process if the sentence is valid
    const perimetreGroup = this.perimetreArray.at(perimetreIndex) as FormGroup;
    
    // Check if the sentence has valid content before switching to display mode
    // No longer requiring ramifications for display mode
    if (perimetreGroup.get('sentence')?.valid) {
      this.ensurePerimetreArraysSize();
      this.perimetreEditModes[perimetreIndex] = false;
    }
  }

  closeProjetDialog(): void {
    this.showProjetDialog = false;
    this.editingProjetIndex = null;
  }

  saveProjet(): void {
    if (this.projetForm.valid) {
      const formData = this.projetForm.getRawValue();
      
      // Ensure CV exists before creating project
      this.ensureCvExists().subscribe({
        next: (cvId: string) => {
          // Convert the perimetre form array to the expected object format
          const perimetreObject: { [key: string]: string[] } = {};
          formData.perimetre.forEach((p: any) => {
            if (p.sentence && p.ramifications && p.ramifications.length > 0) {
              perimetreObject[p.sentence] = p.ramifications;
            }
          });

          const projetData: ProjetDto = {
            id: formData.id || '',
            cvId: cvId, // Add this line to include cvId
            nom: formData.nom,
            year: formData.year,
            client: formData.client || '',
            domaine: formData.domaine || '',
            role: formData.role || '',
            perimetre: perimetreObject
          };
          
          // Save to backend
          if (projetData.id) {            // Update existing project
            this.projetService.updateProjet(projetData.id, projetData).subscribe({
              next: (updatedProjet) => {
                console.log('Project updated successfully:', updatedProjet);
                
                // Create audit log for edit operation
               
                this.createAuditLog(Operation.Edit, ElementsCv.Projet);
                
                if (this.editingProjetIndex !== null) {
                  const projetGroup = this.fb.group({
                    id: [updatedProjet.id],
                    nom: [updatedProjet.nom, Validators.required],
                    year: [updatedProjet.year, Validators.required],
                    client: [updatedProjet.client],
                    domaine: [updatedProjet.domaine, Validators.required],
                    role: [updatedProjet.role, Validators.required],
                    perimetre: [this.convertPerimetreObjectToFormArray(updatedProjet.perimetre)]
                  });
                  
                  this.projetsArray.setControl(this.editingProjetIndex, projetGroup);
                }
                
                this.closeProjetDialog();
                // Auto-save the CV
                this.onSubmit();
              },
              error: (error) => {
                console.error('Error updating project:', error);
              }
            });
          } else {            // Add new project
            this.projetService.createProjet(projetData).subscribe({
              next: (createdProjet) => {
                console.log('Project created successfully:', createdProjet);
                
                // Create audit log for add operation
                this.createAuditLog(Operation.Add, ElementsCv.Projet);
                
                const newProjet = typeof createdProjet === 'string' 
                  ? { ...projetData, id: createdProjet } 
                  : createdProjet;
                
                const projetGroup = this.fb.group({
                  id: [newProjet.id],
                  nom: [newProjet.nom, Validators.required],
                  year: [newProjet.year, Validators.required],
                  client: [newProjet.client],
                  domaine: [newProjet.domaine, Validators.required],
                  role: [newProjet.role, Validators.required],
                  perimetre: [this.convertPerimetreObjectToFormArray(newProjet.perimetre)]
                });
                
                this.projetsArray.push(projetGroup);
                
                this.closeProjetDialog();
                // Auto-save the CV
                this.onSubmit();
              },
              error: (error) => {
                console.error('Error creating project:', error);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error ensuring CV exists:', error);
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.projetForm.controls).forEach(key => {
        const control = this.projetForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  // Delete a project
  deleteProjet(index: number): void {
    if (index < 0 || index >= this.projetsArray.length) {
      console.error('Invalid project index');
      return;
    }
    
    const projetGroup = this.projetsArray.at(index) as FormGroup;
    const projetId = projetGroup.get('id')?.value;
    
    if (!projetId) {
      console.error('Project ID not found');
      return;
    }
    
    // Show confirmation dialog or directly proceed with deletion
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {      this.projetService.deleteProjet(projetId).subscribe({
        next: () => {
          console.log('Project deleted successfully');
          
          // Create audit log for delete operation
          this.createAuditLog(Operation.Delete, ElementsCv.Projet);
          
          // Remove from the form array
          this.projetsArray.removeAt(index);
          
          // Auto-save the CV after deleting a project
          this.onSubmit();
        },
        error: (error) => {
          console.error('Error deleting project:', error);
        }
      });
    }
  }

  // Helper method to format dates as years
  getYearFromDate(date: any): string {
    if (!date) {
      return '';
    }
    
    // If it's already a year number (string or number)
    if (typeof date === 'string' || typeof date === 'number') {
      // Check if it's a 4-digit year
      const yearStr = date.toString();
      if (/^\d{4}$/.test(yearStr)) {
        return yearStr;
      }
    }
    
    // If it's a Date object
    if (date instanceof Date) {
      return date.getFullYear().toString();
    }
    
    // Try to parse it as a date
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.getFullYear().toString();
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
    
    // If all else fails
    return '';
  }

  // Handle drag and drop for languages
  onLangueDrop(event: CdkDragDrop<any[]>): void {
    // Get the FormArray of languages
    const langues = this.languesArray;
    
    // Use the CDK utility function to move the item within the array
    moveItemInArray(langues.controls, event.previousIndex, event.currentIndex);

    // After reordering the FormArray, we need to update the languesPratiquees dictionary
    // Since dictionaries don't have a concept of order, we'll rebuild it with a new object
    const newLanguesPratiquees: {[langue: string]: NiveauLangue} = {};
    
    // Loop through the reordered form array to rebuild the languesPratiquees dictionary
    langues.controls.forEach((control) => {
      const langueGroup = control as FormGroup;
      const langue = langueGroup.get('langue')?.value;
      const niveau = langueGroup.get('niveau')?.value as NiveauLangue;
      
      if (langue && niveau) {
        newLanguesPratiquees[langue] = niveau;
      }
    });
    
    // Replace the old dictionary with the new one
    this.languesPratiquees = newLanguesPratiquees;
    
    // Log that the order has been updated
    console.log('Language order updated:', this.languesPratiquees);
    
    // Automatically save changes to persist the new order
    this.onSubmit();
  }

  // Handle drag and drop for certifications
  onCertificationDrop(event: CdkDragDrop<any[]>): void {
    // Get the FormArray of certifications
    const certifications = this.certificationsArray;
    
    // Use the CDK utility function to move the item within the array
    moveItemInArray(certifications.controls, event.previousIndex, event.currentIndex);
    
    // Automatically save changes to persist the new order
    this.onSubmit();
  }

  // Handle drag and drop for ramifications
  onRamificationDrop(event: CdkDragDrop<any[]>, perimetreIndex: number): void {
    // Get the FormArray of ramifications for this perimetre
    const ramifications = this.getRamificationsArray(perimetreIndex);
    
    // Use the CDK utility function to move the item within the array
    moveItemInArray(ramifications.controls, event.previousIndex, event.currentIndex);
    
    // Mark the form as dirty to ensure changes are saved when the user clicks "Enregistrer"
    this.projetForm.markAsDirty();
  }

  // Handle drag and drop for perimetre sentences in display mode
  onPerimetreDrop(event: CdkDragDrop<any[]>): void {
    // Get the FormArray of perimetres
    const perimetres = this.perimetreArray;
    
    // Use the CDK utility function to move the item within the array
    moveItemInArray(perimetres.controls, event.previousIndex, event.currentIndex);
    
    // Also move the edit modes and expand states arrays to keep them in sync
    moveItemInArray(this.perimetreEditModes, event.previousIndex, event.currentIndex);
    moveItemInArray(this.perimetreExpandStates, event.previousIndex, event.currentIndex);
    
    // Mark the form as dirty to ensure changes are saved when the user clicks "Enregistrer"
    this.projetForm.markAsDirty();
  }

  // Scroll to a specific project and highlight it
  scrollToProject(projectId: string | null): void {
    if (!projectId) return;
    
    console.log('Attempting to scroll to project with ID:', projectId);
    
    // First expand the projects section if it's not already expanded
    this.expandedSections.projets = true;
    
    // Find the index of the project in the projetsArray
    let projectIndex = -1;
    for (let i = 0; i < this.projetsArray.length; i++) {
      const project = this.projetsArray.at(i) as FormGroup;
      if (project.get('id')?.value === projectId) {
        projectIndex = i;
        break;
      }
    }
    
    if (projectIndex === -1) {
      console.log('Project not found in projetsArray');
      return;
    }
    
    console.log('Found project at index:', projectIndex);
    
    // Wait for DOM update after expanding the section
    setTimeout(() => {
      // Get the DOM element for the project
      const projectElement = document.getElementById(`projet-${projectId}`) || 
                             document.getElementById(`projet-${projectIndex}`);
      
      if (!projectElement) {
        console.log('Project element not found in DOM');
        return;
      }
      
      // Scroll to the element
      projectElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Add highlighting class to the element
      projectElement.classList.add('highlighted-project');
      
      // Remove the highlighting class after a few seconds
      setTimeout(() => {
        projectElement.classList.remove('highlighted-project');
      }, 5000);
    }, 500);
  }
  private getProjets(): FormArray {
    return this.cvForm.get('projets') as FormArray;
  }

  // Toggle project visibility
  toggleProjectVisibility(projectIndex: number): void {
    const projectGroup = this.getProjets().at(projectIndex);
    if (projectGroup) {
      const currentHideValue = projectGroup.get('hide')?.value ?? false; // Get current value, default to false if not set
      const cvIdValue = this.cvForm.get('id')?.value;
      const project: ProjetDto = {
        id: projectGroup.get('id')?.value,
        hide: !currentHideValue, // Toggle the current value
        cvId: cvIdValue // Populate cvId
      };

      this.projetService.patchProjet(project).subscribe({
        next: () => {
          // Update local form control after successful patch
          projectGroup.patchValue({ hide: !currentHideValue });
          
          // Notify that the CV has been updated
          const cvId = this.cvForm.get('id')?.value;
          if (cvId) {
            this.cvUpdateService.notifyCvUpdated(cvId);
          }
        },
        error: (error) => {
          console.error('Error toggling project visibility:', error);
          alert('Une erreur est survenue lors de la modification de la visibilité du projet.');
        }
      });
    }
  }

  // Ensure CV exists before creating related entities
  private ensureCvExists(): Observable<string> {
    const cvId = this.cvForm.get('id')?.value;
    
    if (cvId) {
      return of(cvId);
    }
    
    // Create a new CV if it doesn't exist
    const cvData: CvDto = {
      id: '',
      id_user: this.cvForm.get('id_user')?.value,
      presentation: this.cvForm.get('presentation')?.value || '',
      documentUrl: this.fileUrl || undefined
    };

    return this.cvService.createCv(cvData).pipe(
      map(response => {
        const newCvId = typeof response === 'string' ? response : response.id;
        // Update the form with the new CV ID
        this.cvForm.patchValue({ id: newCvId });
        return newCvId;
      })
    );
  }  // Helper method to create audit logs
  private createAuditLog(operation: Operation, element: ElementsCv): void {
    const cvId = this.cvForm.get('id')?.value;
    if (!cvId) {
      console.warn('Cannot create audit log: CV ID not found');
      return;
    }

    const currentUser = this.authService.getStoredUser();
    const decodedToken = this.authService.getDecodedToken();
    
    if (!currentUser || !decodedToken) {
      console.warn('Cannot create audit log: No current user or token found');
      return;
    }

    // Try to get user ID from JWT token (common claims for user ID)
    const userId = decodedToken.sub || 
                   decodedToken.userId || 
                   decodedToken.id || 
                   decodedToken.nameid ||
                   decodedToken.unique_name ||
                   decodedToken.user_id;
    
    if (!userId) {
      console.error('Cannot create audit log: No user ID found in token claims');
      console.error('Available token claims:', Object.keys(decodedToken));
      console.error('Token content:', decodedToken);
      return;
    }    const auditLogData = {
      cvId: cvId,
      typeOperation: operation,    // Use 'typeOperation' to match interface
      element: element,           // Use 'element' to match interface  
      modifiedBy: userId,         // Use user ID instead of full name
      dateModification: new Date() // Use 'dateModification' to match interface
    };

    console.log('Creating audit log with user ID:', userId);
    console.log('Creating audit log with data:', auditLogData);

    this.cvAuditLogService.createAuditLog(auditLogData).subscribe({
      next: (response) => {
        console.log('Audit log created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating audit log:', error);
        
        // Log detailed error information for debugging
        if (error.status) {
          console.error('HTTP Status:', error.status);
        }
        if (error.error) {
          console.error('Error body:', error.error);
          
          // Log validation errors if present
          if (error.error.errors) {
            console.error('Validation errors:', error.error.errors);
          }
          
          // Log title/detail if present
          if (error.error.title) {
            console.error('Error title:', error.error.title);
          }
          if (error.error.detail) {
            console.error('Error detail:', error.error.detail);
          }
        }
        
        // Log the full error object
        console.error('Full error object:', error);
      }
    });
  }
  // Method to navigate to audit log
  navigateToAuditLog(): void {
    const cvId = this.cvForm.get('id')?.value;
    if (cvId) {
      this.router.navigate(['/layout/cv-audit-log', cvId]);
    }
  }
}
