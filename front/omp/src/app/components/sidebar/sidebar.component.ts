import { Component, ChangeDetectorRef, HostListener, ElementRef, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { User } from '../../models/user.interface';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed: boolean = false;
  isDropdownOpen = false;
    menuCategories = [
    {
      name: 'Consulter',
      items: [
        { path: '/layout/dashboard', title: 'Dashboard', icon: 'dashboard' },
        { path: '/layout/opportunites', title: 'Opportunités', icon: 'business_center' },
        { path: '/layout/propositions-financieres', title: 'Propositions Financières', icon: 'request_quote' },
        { path: '/layout/search-cvs', title: 'Chercher un CV', icon: 'search' },
        { path: '/layout/search-references', title: 'Chercher une référence', icon: 'find_in_page' }
      ]
    },
    {
      name: 'Nouveau',
      items: [
        { path: '/layout/nouveau-opportunite', title: 'Opportunité', icon: 'rocket_launch', requiresPermission: 'createOpportunity' }, // Changed to a more significant icon
        { path: '/layout/nouveau-reference', title: 'Référence', icon: 'bookmark_add' },
        { path: '/layout/nouveau-cv', title: 'CV', icon: 'person_add' },
        { path: '/layout/nouveau-proposition', title: 'Proposition Financière', icon: 'request_quote', requiresPermission: 'createPropositionFinanciere' }
      ]
    },    {
      name: 'Administration',
      items: [
        { path: '/layout/admin/users', title: 'Gestion des Utilisateurs', icon: 'people' }
      ],
      adminOnly: true
    }
  ];
  
  currentUser: User | null = null;
  userInitials: string = '';
  
  // Permission observables
  canCreateOpportunity$: Observable<boolean>;
  canCreatePropositionFinanciere$: Observable<boolean>;
  
  constructor(
    private cdr: ChangeDetectorRef, 
    private elementRef: ElementRef, 
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) {
    // Initialize permission observables
    this.canCreateOpportunity$ = this.permissionService.canCreateOpportunity();
    this.canCreatePropositionFinanciere$ = this.permissionService.canCreatePropositionFinanciere();
  }
  
  ngOnInit() {
    this.loadUserData();
  }
  
  loadUserData() {
    this.currentUser = this.authService.getStoredUser();
    if (this.currentUser) {
      this.userInitials = this.generateInitials(this.currentUser.prenom, this.currentUser.nom);
    }
  }
    generateInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName && firstName.length > 0 ? firstName[0].toUpperCase() : '';
    const lastInitial = lastName && lastName.length > 0 ? lastName[0].toUpperCase() : '';
    return firstInitial + lastInitial;
  }  isAdmin(): boolean {
    // Role 0 = Admin (according to Role enum)
    return this.currentUser?.role === 0;
  }
  // Check if user has permission to see a menu item
  hasPermissionForItem(item: any): Observable<boolean> {
    if (!item.requiresPermission) {
      // If no permission required, always return true
      return of(true);
    }

    switch (item.requiresPermission) {
      case 'createOpportunity':
        return this.canCreateOpportunity$;
      case 'createPropositionFinanciere':
        return this.canCreatePropositionFinanciere$;
      default:
        return of(true);
    }
  }
  // Filter admin items to only show user management
  getFilteredAdminItems(category: any): any[] {
    if (category.adminOnly && this.isAdmin()) {
      // Only show "Gestion des Utilisateurs" for admins
      return category.items.filter((item: any) => 
        item.path === '/layout/admin/users' && item.title === 'Gestion des Utilisateurs'
      );
    }
    return category.items;
  }

  // Get filtered menu categories for admin users
  getFilteredMenuCategories(): any[] {
    if (this.isAdmin()) {
      // For admin users, only show the Administration category with user management
      return this.menuCategories.filter(category => category.adminOnly);
    }
    // For non-admin users, show all categories except admin ones
    return this.menuCategories;
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: MouseEvent): void {
    // Only close if clicking outside the dropdown
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isDropdownOpen) {
        this.isDropdownOpen = false;
        this.cdr.detectChanges();
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}