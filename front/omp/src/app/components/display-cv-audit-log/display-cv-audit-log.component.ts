import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CvAuditLogService } from '../../services/cv-audit-log.service';
import { CvAuditLogDto, Operation, ElementsCv } from '../../models/cv-audit-log.interface';
import { PaginatedResponse } from '../../models/pagination.interface';
import { UserService, UserDto } from '../../services/user.service';

@Component({
  selector: 'app-display-cv-audit-log',
  imports: [CommonModule],
  templateUrl: './display-cv-audit-log.component.html',
  styleUrl: './display-cv-audit-log.component.css'
})
export class DisplayCvAuditLogComponent implements OnInit, OnChanges {
  cvId?: string;
  auditLogs: CvAuditLogDto[] = [];
  currentPage: number = 1;
  pageSize: number = 50;
  totalPages: number = 0;
  totalItems: number = 0;
  isLoading: boolean = false;
  
  // Map to store user names by ID
  userNames: Map<string, string> = new Map();
  
  // Make Math available to template
  Math = Math;
  
  // Enum references for template
  Operation = Operation;
  ElementsCv = ElementsCv;

  constructor(
    private cvAuditLogService: CvAuditLogService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.cvId = params['id'];
      if (this.cvId) {
        this.loadAuditLogs();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cvId'] && this.cvId) {
      this.currentPage = 1; // Reset to first page when CV changes
      this.loadAuditLogs();
    }
  }
  loadAuditLogs(): void {
    if (!this.cvId) return;
    
    this.isLoading = true;
    this.cvAuditLogService.getAuditLogsByCvId(
      this.cvId,
      this.currentPage,
      this.pageSize,
      'DateModification',
      'desc'
    ).subscribe({
      next: (response: PaginatedResponse<CvAuditLogDto>) => {
        this.auditLogs = response.items;
        this.currentPage = response.pageNumber;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalCount;
        
        // Load user names for the audit logs
        this.loadUserNames();
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.isLoading = false;
      }
    });
  }
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadAuditLogs();
    }
  }

  loadUserNames(): void {
    // Get unique user IDs from audit logs
    const userIds = [...new Set(this.auditLogs.map(log => log.modifiedBy))];
    
    if (userIds.length === 0) {
      this.isLoading = false;
      return;
    }

    // Create observables for each user ID
    const userObservables = userIds.map(userId => 
      this.userService.getUserById(userId).pipe(
        catchError(error => {
          console.error(`Error fetching user with ID ${userId}:`, error);
          return of(null);
        })
      )
    );

    // Fetch all users
    forkJoin(userObservables).subscribe({
      next: (users: (UserDto | null)[]) => {
        // Clear existing user names
        this.userNames.clear();
        
        // Store user names in the map
        users.forEach((user, index) => {
          if (user) {
            this.userNames.set(userIds[index], `${user.prenom} ${user.nom}`);
          } else {
            // Fallback to user ID if user not found
            this.userNames.set(userIds[index], userIds[index]);
          }
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user names:', error);
        this.isLoading = false;
      }
    });
  }

  getUserName(userId: string): string {
    return this.userNames.get(userId) || userId;
  }

  getUserInitials(userId: string): string {
    const userName = this.userNames.get(userId);
    if (userName && userName !== userId) {
      // Split the name and get first letter of each word
      const nameParts = userName.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
      } else if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
      }
    }
    // Fallback to first two characters of userId if no proper name
    return userId.substring(0, 2).toUpperCase();
  }

  getAvatarColor(userId: string): string {
    // Generate a consistent color based on userId
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0984E3', '#6C5CE7', '#A29BFE',
      '#FD79A8', '#E17055', '#81ECEC', '#74B9FF', '#55A3FF'
    ];
    
    // Create a simple hash from userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use hash to pick a color
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
  getOperationText(operation: Operation): string {
    switch (operation) {
      case Operation.Add:
        return 'Ajout';
      case Operation.Edit:
        return 'Modification';
      case Operation.Delete:
        return 'Suppression';
      default:
        return 'Inconnu';
    }
  }

  getElementText(element: ElementsCv): string {
    switch (element) {
      case ElementsCv.File:
        return 'Fichier';
      case ElementsCv.Presentation:
        return 'Présentation';
      case ElementsCv.Experience:
        return 'Expérience';
      case ElementsCv.Formation:
        return 'Formation';
      case ElementsCv.Langue:
        return 'Langue';
      case ElementsCv.Certification:
        return 'Certification';
      case ElementsCv.Projet:
        return 'Projet';
      default:
        return 'Inconnu';
    }
  }

  getElementClass(element: ElementsCv): string {
    switch (element) {
      case ElementsCv.File:
        return 'element-file';
      case ElementsCv.Presentation:
        return 'element-presentation';
      case ElementsCv.Experience:
        return 'element-experience';
      case ElementsCv.Formation:
        return 'element-formation';
      case ElementsCv.Langue:
        return 'element-langue';
      case ElementsCv.Certification:
        return 'element-certification';
      case ElementsCv.Projet:
        return 'element-projet';
      default:
        return 'element-unknown';
    }
  }

  getElementIcon(element: ElementsCv): string {
    switch (element) {
      case ElementsCv.File:
        return 'fas fa-file-alt';
      case ElementsCv.Presentation:
        return 'fas fa-user';
      case ElementsCv.Experience:
        return 'fas fa-briefcase';
      case ElementsCv.Formation:
        return 'fas fa-graduation-cap';
      case ElementsCv.Langue:
        return 'fas fa-language';
      case ElementsCv.Certification:
        return 'fas fa-certificate';
      case ElementsCv.Projet:
        return 'fas fa-project-diagram';
      default:
        return 'fas fa-question';
    }
  }

  getOperationClass(operation: Operation): string {
    switch (operation) {
      case Operation.Add:
        return 'operation-add';
      case Operation.Edit:
        return 'operation-edit';
      case Operation.Delete:
        return 'operation-delete';
      default:
        return '';
    }
  }

  goBack(): void {
    // Navigate back to the edit CV page
    if (this.cvId) {
      this.router.navigate(['/layout/edit-cv', this.cvId]);
    }
  }
}
