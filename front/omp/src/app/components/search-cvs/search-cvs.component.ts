import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, NavigationExtras } from '@angular/router';
import { CvService } from '../../services/cv.service';
import { UserService, UserDto } from '../../services/user.service';
import { CvDto } from '../../models/cv.interface';
import { CvDocumentService } from '../../services/cv-document.service';
import { ProjetService } from '../../services/projet.service';
import { ProjetDto } from '../../models/projet.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { PaginatedResponse } from '../../models/pagination.interface';

@Component({
  selector: 'app-search-cvs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClickOutsideDirective],
  templateUrl: './search-cvs.component.html',
  styleUrl: './search-cvs.component.css'
})
export class SearchCvsComponent implements OnInit {
  // Fixed similarity score - not accessible to the user
  private readonly SIMILARITY_THRESHOLD = 70;

  // CV Data
  cvs: CvDto[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 6;
  totalItems = 0;
  totalPages = 0;
  
  // Map to store user names by ID for display
  userNames: {[key: string]: string} = {};
  
  // Search properties
  searchKeywords: string = '';
  useFuzzySearch: boolean = true;
  isSearchActive: boolean = false;
  
  // Matching projects related properties
  matchingProjects: {[cvId: string]: {[projectId: string]: ProjetDto}} = {};
  loadingProjects: {[cvId: string]: boolean} = {};
  
  // Sidebar related properties
  showProjectsSidebar: boolean = false;
  selectedCvId: string = '';
  selectedCv: CvDto | null = null;
  loadingSelectedCvProjects: boolean = false;

  // User search properties
  userControl = new FormControl('');
  allUsers: UserDto[] = [];
  filteredUsers: UserDto[] = [];
  showUserDropdown: boolean = false;
  selectedUser: UserDto | null = null;
  searchingByUser: boolean = false;

  constructor(
    private cvService: CvService,
    private userService: UserService,
    private cvDocumentService: CvDocumentService,
    private projetService: ProjetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCvs();
    this.loadUsers();
  }

  loadCvs(page: number = 1): void {
    this.isLoading = true;
    this.error = null;
    this.currentPage = page;
    
    this.cvService.getCvs(page, this.pageSize).subscribe({
      next: (response) => {
        this.cvs = response.items;
        this.totalItems = response.totalCount;
        this.totalPages = response.totalPages;
        this.currentPage = response.pageNumber;
        this.pageSize = response.pageSize;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading CVs:', err);
        this.error = 'Erreur lors du chargement des CVs. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        // Create a map of user IDs to user names
        users.forEach(user => {
          this.userNames[user.id] = `${user.prenom} ${user.nom}`;
        });
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  // Show user suggestions dropdown
  showUserSuggestions(): void {
    this.showUserDropdown = true;
    this.filterUsers(this.userControl.value);
  }

  // Filter users based on input
  filterUsers(value: any): void {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    this.filteredUsers = this.allUsers.filter(user => 
      `${user.prenom} ${user.nom}`.toLowerCase().includes(filterValue) ||
      `${user.nom} ${user.prenom}`.toLowerCase().includes(filterValue)
    );
  }
  
  // Select a user from the dropdown
  selectUser(user: UserDto): void {
    this.userControl.setValue(`${user.prenom} ${user.nom}`);
    this.selectedUser = user;
    this.showUserDropdown = false;
    
    // Set the user search flag
    this.searchingByUser = true;
    
    // If there are also keywords entered, use the combined search
    if (this.searchKeywords.trim()) {
      this.searchCvs();
    } else {
      // If no keywords, just search by user
      this.searchCvByUser();
    }
  }

  // Reset user search
  resetUserSearch(): void {
    this.userControl.setValue('');
    this.selectedUser = null;
    this.searchingByUser = false;
    this.resetSearch();
  }
  
  // Search CV by user ID
  searchCvByUser(): void {
    if (!this.selectedUser) {
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    this.searchingByUser = true;
    this.isSearchActive = false; // Not a keyword search
    
    // Reset matching projects and sidebar state
    this.matchingProjects = {};
    this.showProjectsSidebar = false;
    this.selectedCvId = '';
    this.selectedCv = null;
    
    this.cvService.getCvByUserId(this.selectedUser.id).subscribe({
      next: (data) => {
        // Put the single CV in an array for display
        this.cvs = data ? [data] : [];
        this.isLoading = false;
        
        // Reset pagination information for single CV display
        this.totalItems = this.cvs.length;
        this.totalPages = 1;
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Error searching CV by user:', err);
        this.error = 'Erreur lors de la recherche de CV. Veuillez réessayer.';
        this.isLoading = false;
        // Clear results on error
        this.cvs = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });
  }

  // Click outside to close dropdown
  closeUserDropdown(): void {
    this.showUserDropdown = false;
  }

  // View a specific CV
  viewCv(id: string): void {
    this.router.navigate(['/layout/edit-cv', id]);
  }

  // Create a new CV
  createNewCv(): void {
    this.router.navigate(['/layout/nouveau-cv']);
  }

  // Get user name for display
  getUserName(userId: string): string {
    return this.userNames[userId] || 'Utilisateur inconnu';
  }

  // Get a preview of the presentation text
  getPreviewText(text: string, maxLength: number = 100): string {
    if (!text) return 'Aucune présentation';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  // Delete a specific CV
  deleteCv(event: Event, id: string): void {
    // Stop propagation to prevent navigation to the CV edit page
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce CV? Cette action est irréversible.')) {
      this.isLoading = true;
      this.error = null;
      
      // First get the CV details to check if it has a document URL
      this.cvService.getCvById(id).pipe(
        switchMap((cv) => {
          // If the CV has a document URL, delete it from Azure Blob storage first
          if (cv.documentUrl) {
            // Extract the file name from the URL
            const fileName = this.extractFileNameFromUrl(cv.documentUrl);
            
            // Delete the document from Azure Blob storage and then delete the CV
            return this.cvDocumentService.deleteDocument(id, encodeURIComponent(fileName)).pipe(
              catchError((error: HttpErrorResponse) => {
                console.error('Error deleting document from storage:', error);
                // Continue deleting the CV even if document deletion fails
                return of(null);
              }),
              switchMap(() => this.cvService.deleteCv(id))
            );
          } else {
            // If no document URL, just delete the CV
            return this.cvService.deleteCv(id);
          }
        }),
        catchError((error) => {
          console.error('Error in CV deletion process:', error);
          this.error = 'Erreur lors de la suppression du CV. Veuillez réessayer.';
          this.isLoading = false;
          return of(null);
        })
      ).subscribe({
        next: () => {
          console.log('CV successfully deleted');
          // After successful deletion, reload the CV list
          this.loadCvs(this.currentPage);
        },
        error: (err: any) => {
          console.error('Error deleting CV:', err);
          this.error = 'Erreur lors de la suppression du CV. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
    }
  }  

  searchCvs(page: number = 1): void {
    // If there's already a user search active and the search keywords is empty,
    // don't do anything - maintain the current user search results
    if (this.searchingByUser && !this.searchKeywords.trim()) {
      return;
    }
    
    // If no keywords are provided and no user is selected, reset to show all CVs
    if (!this.searchKeywords.trim() && !this.selectedUser) {
      this.resetAllSearches();
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    this.isSearchActive = this.searchKeywords.trim().length > 0;
    this.currentPage = page;
    
    // Reset matching projects and sidebar state
    this.matchingProjects = {};
    this.showProjectsSidebar = false;
    this.selectedCvId = '';
    this.selectedCv = null;
    
    // If we have a selected user and keywords, search for CVs by user first
    if (this.selectedUser && this.searchKeywords.trim()) {
      // User search has priority - get the user's CV first, 
      // then search for keywords in the filtered results later if needed
      this.searchingByUser = true;
      
      this.cvService.getCvByUserId(this.selectedUser.id).subscribe({
        next: (data) => {
          // If user has a CV and there are keywords, filter it with keywords
          if (data && this.searchKeywords.trim()) {
            const cvArray = [data]; // Convert single CV to array
            this.isLoading = true;
            
            this.cvService.searchCvsByKeywords(
              this.searchKeywords,
              this.useFuzzySearch,
              this.SIMILARITY_THRESHOLD,
              1, // Always page 1 for user-specific search
              this.pageSize
            ).subscribe({
              next: (response) => {
                // Only keep results that match both the user and keywords
                // We only need to check if the user's CV ID is in the keyword results
                const userCvId = data.id;
                const matchingResults = response.items.filter(cv => cv.id === userCvId);
                this.cvs = matchingResults;
                this.isLoading = false;
                
                // Set pagination for filtered results
                this.totalItems = matchingResults.length;
                this.totalPages = 1; // Always one page for filtered user results
                this.currentPage = 1;
              },
              error: (err) => {
                console.error('Error searching CVs by keywords:', err);
                this.error = 'Erreur lors de la recherche des CVs. Veuillez réessayer.';
                this.isLoading = false;
                this.totalItems = 0;
                this.totalPages = 0;
              }
            });
          } else {
            // Just user search, no keywords
            this.cvs = data ? [data] : [];
            this.isLoading = false;
            
            // Set pagination for user results
            this.totalItems = this.cvs.length;
            this.totalPages = 1; // Always one page for user results
            this.currentPage = 1;
          }
        },
        error: (err) => {
          console.error('Error searching CV by user:', err);
          this.error = 'Erreur lors de la recherche de CV. Veuillez réessayer.';
          this.isLoading = false;
          this.cvs = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
    } 
    // If we only have keywords (no user selected), do a regular keyword search
    else if (this.searchKeywords.trim()) {
      this.cvService.searchCvsByKeywords(
        this.searchKeywords,
        this.useFuzzySearch,
        this.SIMILARITY_THRESHOLD,
        page,
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.cvs = response.items;
          this.totalItems = response.totalCount;
          this.totalPages = response.totalPages;
          this.currentPage = response.pageNumber;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error searching CVs:', err);
          this.error = 'Erreur lors de la recherche des CVs. Veuillez réessayer.';
          this.isLoading = false;
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
    }
  }

  resetSearch(): void {
    this.searchKeywords = '';
    this.isSearchActive = false;
    this.matchingProjects = {};
    this.showProjectsSidebar = false;
    this.selectedCvId = '';
    this.selectedCv = null;
    this.loadCvs(1); // Reset to page 1
  }

  // Reset all searches (both keyword and user searches)
  resetAllSearches(): void {
    // Reset keyword search
    this.searchKeywords = '';
    this.isSearchActive = false;
    
    // Reset user search
    this.userControl.setValue('');
    this.selectedUser = null;
    this.searchingByUser = false;
    
    // Reset other states
    this.matchingProjects = {};
    this.showProjectsSidebar = false;
    this.selectedCvId = '';
    this.selectedCv = null;
    
    // Load all CVs
    this.loadCvs(1); // Reset to page 1
  }
  
  // Navigate to specific page
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    // If we're searching with keywords, use the search function
    if (this.isSearchActive) {
      this.searchCvs(page);
    } else {
      // Otherwise, load CVs normally
      this.loadCvs(page);
    }
  }
  
  // Helper method to extract file name from URL
  private extractFileNameFromUrl(url: string): string {
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
  
  // Show matching projects in the sidebar
  showMatchingProjects(event: Event, cv: CvDto): void {
    event.stopPropagation(); // Prevent navigation to CV edit page
    
    this.selectedCvId = cv.id;
    this.selectedCv = cv;
    this.showProjectsSidebar = true;
    
    // If we haven't loaded the projects yet, fetch them
    if (!this.matchingProjects[cv.id] || Object.keys(this.matchingProjects[cv.id]).length === 0) {
      this.loadMatchingProjects(cv);
    }
  }
  
  // Load the matching projects for a CV
  loadMatchingProjects(cv: CvDto): void {
    if (!cv.matchedProjectIds || cv.matchedProjectIds.length === 0) {
      return;
    }
    
    this.loadingProjects[cv.id] = true;
    this.loadingSelectedCvProjects = this.selectedCvId === cv.id;
    
    // Create an array of project observables
    const projectObservables = cv.matchedProjectIds.map(projectId => 
      this.projetService.getProjetById(projectId).pipe(
        catchError(error => {
          console.error(`Error loading project ${projectId}:`, error);
          return of(null);
        })
      )
    );
    
    // Use forkJoin to wait for all requests to complete
    forkJoin(projectObservables).subscribe({
      next: (projects) => {
        this.matchingProjects[cv.id] = {};
        
        // Filter out null results and add valid projects to the map
        projects.filter(p => p !== null).forEach(project => {
          if (project) {
            if (!this.matchingProjects[cv.id]) {
              this.matchingProjects[cv.id] = {};
            }
            this.matchingProjects[cv.id][project.id] = project;
          }
        });
        
        this.loadingProjects[cv.id] = false;
        if (this.selectedCvId === cv.id) {
          this.loadingSelectedCvProjects = false;
        }
      },
      error: (err) => {
        console.error('Error loading matching projects:', err);
        this.loadingProjects[cv.id] = false;
        if (this.selectedCvId === cv.id) {
          this.loadingSelectedCvProjects = false;
        }
      }
    });
  }
  
  // Check if a CV has matching projects
  hasMatchingProjects(cv: CvDto): boolean {
    return !!cv.matchedProjectIds && cv.matchedProjectIds.length > 0;
  }
  
  // Get array of projects from the matching projects map
  getMatchingProjectsArray(cvId: string): ProjetDto[] {
    if (!this.matchingProjects[cvId]) {
      return [];
    }
    return Object.values(this.matchingProjects[cvId]);
  }
  
  // Navigate to the edit-cv component with the selected project and highlighting keywords
  navigateToProjectInCv(projectId: string, cvId: string): void {
    console.log('Navigating to project in edit CV view:', projectId, cvId);
    console.log('Search keywords to highlight:', this.searchKeywords);
    
    // Prepare the navigation extras with query params for keyword highlighting
    const navigationExtras: NavigationExtras = {
      queryParams: {
        highlightKeywords: this.searchKeywords,
        highlightProjectId: projectId
      }
    };
      console.log('Navigation extras:', navigationExtras);
    
    // Navigate to the edit-cv component with the CV ID and query params
    this.router.navigate(['/layout/edit-cv', cvId], navigationExtras);
  }
  
  // Close the projects sidebar
  closeProjectsSidebar(): void {
    this.showProjectsSidebar = false;
    this.selectedCvId = '';
    this.selectedCv = null;
  }
}
