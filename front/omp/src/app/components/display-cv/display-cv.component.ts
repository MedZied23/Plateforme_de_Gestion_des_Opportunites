import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CvService } from '../../services/cv.service';
import { UserService, UserDto } from '../../services/user.service';
import { ExperienceService } from '../../services/experience.service';
import { FormationService } from '../../services/formation.service';
import { ProjetService } from '../../services/projet.service';
import { CvUpdateService } from '../../services/cv-update.service';
import { CvDto } from '../../models/cv.interface';
import { ExperienceDto } from '../../models/experience.interface';
import { FormationDto } from '../../models/formation.interface';
import { ProjetDto } from '../../models/projet.interface';
import { Observable, forkJoin, of, catchError, map, switchMap, Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NiveauLangue } from '../../models/niveau-langue.enum';

@Component({
  selector: 'app-display-cv',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-cv.component.html',
  styleUrl: './display-cv.component.css'
})
export class DisplayCvComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cvId: string | null = null;
  @ViewChild('cvContainer') cvContainer!: ElementRef;
  
  cv: CvDto | null = null;
  user: UserDto | null = null;
  experiences: ExperienceDto[] = [];
  formations: FormationDto[] = [];
  certifications: string[] = [];
  projets: ProjetDto[] = [];
  langues: { langue: string, niveau: NiveauLangue }[] = [];
  loading = false;
  error: string | null = null;
  
  // Parameters for highlighting
  highlightKeywords: string = '';
  highlightProjectId: string = '';
  keywordsArray: string[] = [];

  private subscription: Subscription = new Subscription();
  
  private groupedProjets: { [key: string]: ProjetDto[] } = {};

  // Flag to determine if the view is accessed from a search
  private isFromSearch: boolean = false;

  constructor(
    private cvService: CvService,
    private userService: UserService,
    private experienceService: ExperienceService,
    private formationService: FormationService,
    private projetService: ProjetService,
    private cvUpdateService: CvUpdateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get the CV ID from the route parameters if not provided via input
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && !this.cvId) {
        this.cvId = id;
        this.loadCvIfIdExists();
      }
    });
    
    // Get query parameters for highlighting
    this.route.queryParamMap.subscribe(params => {
      this.highlightKeywords = params.get('highlightKeywords') || '';
      this.highlightProjectId = params.get('highlightProjectId') || '';
      this.isFromSearch = !!this.highlightKeywords; // Set isFromSearch based on presence of search keywords
      
      console.log('Query params received:', {
        highlightKeywords: this.highlightKeywords,
        highlightProjectId: this.highlightProjectId,
        isFromSearch: this.isFromSearch
      });
      
      if (this.highlightKeywords) {
        // Split keywords by spaces and remove empty strings
        this.keywordsArray = this.highlightKeywords.split(/\s+/).filter(k => k.trim() !== '');
        console.log('Keywords array:', this.keywordsArray);
      }
      
      // If we already have projects loaded, scroll to the highlighted project
      this.scrollToHighlightedProject();
    });
    
    // Subscribe to CV update notifications
    this.subscription.add(
      this.cvUpdateService.cvUpdated$.subscribe(updatedCvId => {
        // Only reload if the updated CV is the one we're currently displaying
        if (this.cvId === updatedCvId) {
          console.log('CV updated, reloading data:', updatedCvId);
          this.loadCvIfIdExists();
        }
      })
    );
    
    // Subscribe to direct CV data updates
    this.subscription.add(
      this.cvUpdateService.cvData$.subscribe(cvData => {
        // Only update if the CV data is for the one we're currently displaying
        if (this.cvId === cvData.id) {
          console.log('Received updated CV data:', cvData.id);
          this.cv = cvData;
          
          // Refresh the user data if the user ID changed and exists
          if (this.user?.id !== cvData.id_user && cvData.id_user) {
            this.userService.getUserById(cvData.id_user).subscribe(user => {
              this.user = user;
            });
          }
          
          // Reload all the related data
          this.loadRelatedData();
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cvId']) {
      this.loadCvIfIdExists();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadCvIfIdExists(): void {
    if (this.cvId) {
      this.loading = true;
      this.error = null;
      
      this.cvService.getCvById(this.cvId)
        .pipe(
          switchMap(cv => {
            this.cv = cv;
            
            if (!cv.id_user) {
              return of(null);
            }
            
            return this.userService.getUserById(cv.id_user);
          }),
          catchError(err => {
            this.error = `Erreur lors du chargement du CV: ${err.message}`;
            console.error('Error loading CV:', err);
            return of(null);
          })
        )
        .subscribe(user => {
          this.loading = false;
          if (user) {
            this.user = user;
          }
          
          // Load related data
          this.loadRelatedData();
        });
    }
  }

  // Helper method to filter projects based on visibility and search context
  private filterProjects(projects: ProjetDto[]): ProjetDto[] {
    if (this.isFromSearch) {
      // When accessed from search, show all projects
      return projects;
    }
    // In normal display mode, only show projects with hide=false or undefined
    return projects.filter(project => !project.hide);
  }

  private loadRelatedData(): void {
    let observables: Observable<any>[] = [];
    
    if (this.cv) {
      // Load experiences from ExperienceService
      if (this.cv.experiences && this.cv.experiences.length > 0) {
        const experienceRequests = this.cv.experiences.map(id => 
          this.experienceService.getExperienceById(id).pipe(
            catchError(error => {
              console.error(`Error fetching experience with ID ${id}:`, error);
              return of(null);
            })
          )
        );
        
        if (experienceRequests.length > 0) {
          observables.push(
            forkJoin(experienceRequests).pipe(
              map(experiences => ({
                type: 'experiences',
                data: experiences.filter(exp => exp !== null)
              }))
            )
          );
        }
      }
      
      // Load formations from FormationService
      if (this.cv.formations && this.cv.formations.length > 0) {
        const formationRequests = this.cv.formations.map(id => 
          this.formationService.getFormationById(id).pipe(
            catchError(error => {
              console.error(`Error fetching formation with ID ${id}:`, error);
              return of(null);
            })
          )
        );
        
        if (formationRequests.length > 0) {
          observables.push(
            forkJoin(formationRequests).pipe(
              map(formations => ({
                type: 'formations',
                data: formations.filter(formation => formation !== null)
              }))
            )
          );
        }
      }
      
      // Load certifications (these are just strings in the CV)
      if (this.cv.certifications) {
        this.certifications = this.cv.certifications;
      }
      
      // Load projets from ProjetService
      if (this.cv.projets && this.cv.projets.length > 0) {
        const projetRequests = this.cv.projets.map(id => 
          this.projetService.getProjetById(id).pipe(
            catchError(error => {
              console.error(`Error fetching project with ID ${id}:`, error);
              return of(null);
            })
          )
        );
        
        if (projetRequests.length > 0) {
          observables.push(
            forkJoin(projetRequests).pipe(
              map(projets => ({
                type: 'projets',
                data: this.filterProjects(projets.filter(projet => projet !== null))
              }))
            )
          );
        }
      }
      
      // Process langues
      if (this.cv?.languesPratiquees) {
        this.langues = Object.entries(this.cv.languesPratiquees).map(([langue, niveau]) => ({
          langue,
          niveau
        }));
      }

      // Subscribe to all observables
      if (observables.length > 0) {
        forkJoin(observables).subscribe({
          next: (results) => {
            for (const result of results) {
              if (result && result.type === 'experiences') {
                this.experiences = result.data;
                // Sort experiences by date (most recent first)
                this.experiences.sort((a, b) => {
                  const dateA = a.dateFin ? new Date(a.dateFin).getTime() : new Date().getTime();
                  const dateB = b.dateFin ? new Date(b.dateFin).getTime() : new Date().getTime();
                  return dateB - dateA;
                });
              } else if (result && result.type === 'formations') {
                this.formations = result.data;
                // Sort formations by date (most recent first)
                this.formations.sort((a, b) => {
                  const dateA = a.dateFin ? new Date(a.dateFin).getTime() : new Date().getTime();
                  const dateB = b.dateFin ? new Date(b.dateFin).getTime() : new Date().getTime();
                  return dateB - dateA;
                });
              } else if (result && result.type === 'projets') {
                this.projets = result.data;
                // Sort projets by year (most recent first)
                this.projets.sort((a, b) => {
                  const yearA = a.year ?? 0;
                  const yearB = b.year ?? 0;
                  return yearB - yearA;
                });
                // Group projects by domain
                this.groupProjectsByDomain();
              }
            }
          }
        });
      }
    }
  }

  // New method to group projects by domain
  private groupProjectsByDomain(): void {
    this.groupedProjets = this.projets.reduce((groups, projet) => {
      const domaine = projet.domaine || 'Autres';
      if (!groups[domaine]) {
        groups[domaine] = [];
      }
      groups[domaine].push(projet);
      return groups;
    }, {} as { [key: string]: ProjetDto[] });
  }

  /**
   * Helper method to get the keys of the périmètre object
   * This is needed because we can't directly use Object.keys() in the template
   */
  getPerimetreKeys(perimetre: {[key: string]: string[]} | undefined): string[] {
    if (!perimetre) return [];
    return Object.keys(perimetre);
  }

  getYearFromDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).getFullYear().toString();
  }

  // Check if a project should be highlighted
  isHighlightedProject(projectId: string): boolean {
    return this.highlightProjectId === projectId;
  }

  // Check if the text contains any of the search keywords
  containsKeywords(text: string | undefined | null): boolean {
    if (!text || !this.keywordsArray.length) return false;
    
    const lowerText = text.toLowerCase();
    return this.keywordsArray.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  // Highlight keywords in text, ensuring they don't overlap project boundaries
  highlightText(text: string | undefined | null): string {
    if (!text || !this.keywordsArray.length) return text || '';
    
    let result = text;
    
    // Replace each keyword with a highlighted version, case-insensitive
    this.keywordsArray.forEach(keyword => {
      if (keyword.trim() === '') return;
      
      // Instead of using word boundaries which might not work well for all situations,
      // we'll ensure highlighting doesn't cross project boundaries by using a custom approach
      const parts = result.split(new RegExp(`(${this.escapeRegExp(keyword)})`, 'gi'));
      
      // Reconstruct the string with highlighted matches
      result = parts.map((part, index) => {
        // Every odd-indexed part is a match to our keyword
        if (index % 2 === 1) {
          return `<span class="highlighted-text">${part}</span>`;
        }
        return part;
      }).join('');
    });
    
    return result;
  }

  // Helper method to escape special regex characters
  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private scrollToHighlightedProject(): void {
    // Wait for DOM to be updated with projects
    setTimeout(() => {
      if (this.highlightProjectId) {
        const element = document.getElementById(`project-${this.highlightProjectId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Add a special highlight class to make it stand out
          element.classList.add('highlighted-project');
        }
      }
    }, 500); // Short delay to ensure DOM is updated
  }

  // Helper method to get domain keys
  getDomaines(): string[] {
    return Object.keys(this.groupedProjets).sort();
  }

  // Helper method to get projects for a domain
  getProjetsByDomaine(domaine: string): ProjetDto[] {
    return this.groupedProjets[domaine] || [];
  }
  
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

  async generatePDF() {
    try {
      const cvElement = this.cvContainer.nativeElement;
      const totalWidth = cvElement.scrollWidth;
      const totalHeight = cvElement.scrollHeight;

      // Store original styles
      const originalBackground = cvElement.style.background;
      const originalHeight = cvElement.style.height;
      const originalOverflow = cvElement.style.overflow;

      // Set temporary styles for capturing
      cvElement.style.background = 'white';
      cvElement.style.height = `${totalHeight}px`;
      cvElement.style.overflow = 'visible';      const canvas = await html2canvas(cvElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: totalWidth,
        height: totalHeight,
        windowWidth: totalWidth,
        windowHeight: totalHeight,
        scrollY: 0,
        scrollX: 0,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Hide elements with no-print class
          const noPrintElements = clonedDoc.querySelectorAll('.no-print');
          noPrintElements.forEach(element => {
            (element as HTMLElement).style.display = 'none';
          });

          const clonedElement = clonedDoc.querySelector('#cvContainer') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.height = `${totalHeight}px`;
            clonedElement.style.overflow = 'visible';
          }
        }
      });// Restore original styles
      cvElement.style.background = originalBackground;
      cvElement.style.height = originalHeight;
      cvElement.style.overflow = originalOverflow;      // Calculate dimensions for A4 with margins
      const margin = 15; // 15mm margins
      const imgWidth = 210 - (2 * margin); // A4 width minus margins
      const pageHeight = 297 - (2 * margin); // A4 height minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // Define table selectors to avoid cutting
      const tableSelectors = ['table', '.table-container', '.grid-container'];
      
      // Function to check if a position would cut through a table
      const wouldCutTable = (yPos: number) => {
        const scaleFactor = canvas.width / imgWidth;
        const pixelPos = yPos * scaleFactor;
        const tolerance = 50; // pixels to check around the cut point
        
        return tableSelectors.some(selector => {
          const tables = cvElement.querySelectorAll(selector);
          return Array.from(tables).some(table => {
            const rect = (table as HTMLElement).getBoundingClientRect();
            return pixelPos > rect.top && pixelPos < rect.bottom;
          });
        });
      };

      // Add pages as needed
      while (position < imgHeight) {
        if (position > 0) {
          pdf.addPage();
        }
        
        // Calculate the height to slice for current page
        let heightLeft = imgHeight - position;
        const maxSliceHeight = Math.min(pageHeight, heightLeft);
        
        // Find the best cut point
        let sliceHeight = maxSliceHeight;
        const scaleFactor = canvas.width / imgWidth;
        const pixelsPerMM = scaleFactor;
        
        // Try to find a good breaking point within the last 20mm of the page
        const searchRange = 20 * pixelsPerMM;
        if (heightLeft > pageHeight) {
          for (let i = 0; i < searchRange; i++) {
            const testHeight = maxSliceHeight - (i / pixelsPerMM);
            if (!wouldCutTable(position + testHeight)) {
              sliceHeight = testHeight;
              break;
            }
          }
        }
        
        // Create a new canvas for the current slice
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sliceHeight * scaleFactor;
        const ctx = tempCanvas.getContext('2d')!;
        
        // Draw the slice with proper positioning
        ctx.drawImage(
          canvas,
          0,
          position * scaleFactor,
          canvas.width,
          sliceHeight * scaleFactor,
          0,
          0,
          canvas.width,
          sliceHeight * scaleFactor
        );
        
        // Add the slice to PDF with margins
        const imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, sliceHeight);
        
        position += sliceHeight;
      }

      // Download the PDF
      const fileName = this.user ? `CV_${this.user.prenom}_${this.user.nom}.pdf` : 'CV.pdf';
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
  }
}
