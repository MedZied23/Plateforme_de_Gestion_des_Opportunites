import { Component, EventEmitter, OnInit, Output, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';

// Define the menu item interface to match the sidebar structure
interface MenuItem {
  path: string;
  title: string;
  icon: string;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private subscriptions: Subscription[] = [];
  @Output() sidebarToggle = new EventEmitter<void>();
  pageTitle: string = 'Opportunité';
  notificationCount: number = 0;
  showNotificationDropdown: boolean = false;
  
  // Define the same menu structure as in sidebar
  private menuCategories: MenuCategory[] = [
    {
      name: 'Consulter',
      items: [
        { path: '/layout/dashboard', title: 'Opportunité', icon: 'dashboard' },
        { path: '/layout/opportunites', title: 'Opportunités', icon: 'business_center' },
        { path: '/layout/propositions-financieres', title: 'Propositions Financières', icon: 'request_quote' },
        { path: '/layout/search-cvs', title: 'Chercher un CV', icon: 'search' },
        { path: '/layout/search-references', title: 'Chercher une référence', icon: 'find_in_page' }
      ]
    },
    {
      name: 'Nouveau',
      items: [
        { path: '/layout/nouveau-opportunite', title: 'Opportunité', icon: 'rocket_launch' },
        { path: '/layout/nouveau-reference', title: 'Référence', icon: 'bookmark_add' },
        { path: '/layout/nouveau-cv', title: 'CV', icon: 'person_add' },
        { path: '/layout/nouveau-proposition', title: 'Proposition Financière', icon: 'request_quote' }
      ]
    },
    {
      name: 'Administration',
      items: [
        { path: '/layout/admin/users', title: 'Gestion des Utilisateurs', icon: 'manage_accounts' }
      ]
    }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Subscribe to router events to update page title
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.updatePageTitle();
    });
    
    // Initial page title update
    this.updatePageTitle();
    
    // Subscribe to notification count updates
    const notificationSub = this.notificationService.unreadCount$.subscribe(count => {
      this.notificationCount = count;
    });
    this.subscriptions.push(notificationSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  onNotificationDropdownClose(): void {
    this.showNotificationDropdown = false;
  }

  private updatePageTitle(): void {
    const currentRoute = this.router.url;

    // Handle routes with query parameters
    if (currentRoute.includes('?')) {
      this.handleRouteWithParams(currentRoute);
      return;
    }

    // Handle routes with ID parameters (like /edit-cv/123 or /add-reference/456)
    if (currentRoute.match(/\/[^\/]+\/[^\/]+\/\d+/) ||
        currentRoute.includes('/edit-cv/') ||
        currentRoute.includes('/add-reference/')) {
      this.handleRouteWithIdParam(currentRoute);
      return;
    }

    // Standard route matching
    for (const category of this.menuCategories) {
      for (const item of category.items) {
        if (currentRoute.includes(item.path) ||
            (currentRoute === '/layout' && item.path === '/layout/nouveau-opportunite')) {
          this.pageTitle = item.title;
          return;
        }
      }
    }

    // Special case handling for specific routes
    if (currentRoute.includes('/layout/opportunity-tracking')) {
      this.pageTitle = 'Opportunité';
      return;
    }
    
    if (currentRoute.includes('/layout/offre-financiere')) {
      this.pageTitle = 'Proposition Financière';
      return;
    }
    
    if (currentRoute.includes('/layout/edit-cv')) {
      this.pageTitle = 'Éditer CV';
      return;
    }
    
    if (currentRoute.includes('/layout/add-reference')) {
      this.pageTitle = 'Éditer Référence';
      return;
    }
    
    if (currentRoute.includes('/layout/display-feuil-one')) {
      this.pageTitle = 'Répartition des charges';
      return;
    }
    
    if (currentRoute.includes('/layout/display-feuil-two')) {
      this.pageTitle = 'Répartition Siège/Terrain';
      return;
    }
    
    if (currentRoute.includes('/layout/setting-depenses')) {
      this.pageTitle = 'Paramètres des dépenses';
      return;
    }
    
    if (currentRoute.includes('/layout/configure-siege-terrain')) {
      this.pageTitle = 'Configuration Siège/Terrain';
      return;
    }
    
    if (currentRoute.includes('/layout/profile-delivrable-matrix')) {
      this.pageTitle = 'Matrice Profil/Livrable';
      return;
    }
    
    if (currentRoute.includes('/layout/notifications')) {
      this.pageTitle = 'Notifications';
      return;
    }

    // Check for admin routes
    if (currentRoute.includes('/layout/admin/users')) {
      this.pageTitle = 'Gestion des Utilisateurs';
      return;
    }

    // Default title
    this.pageTitle = 'Dashboard';
  }

  private handleRouteWithParams(currentRoute: string): void {
    const baseRoute = currentRoute.split('?')[0];
    
    // Handle specific routes with parameters
    if (baseRoute === '/layout/offre-financiere') {
      this.pageTitle = 'Proposition Financière';
    } else if (baseRoute === '/layout/display-feuil-one') {
      this.pageTitle = 'Répartition des charges';
    } else if (baseRoute === '/layout/display-feuil-two') {
      this.pageTitle = 'Répartition Siège/Terrain';
    } else if (baseRoute === '/layout/setting-depenses') {
      this.pageTitle = 'Paramètres des dépenses';
    } else if (baseRoute === '/layout/configure-siege-terrain') {
      this.pageTitle = 'Configuration Siège/Terrain';
    } else if (baseRoute === '/layout/profile-delivrable-matrix') {
      this.pageTitle = 'Matrice Profil/Livrable';
    } else {
      // Fallback to standard route matching
      this.updatePageTitle();
    }
  }

  private handleRouteWithIdParam(currentRoute: string): void {
    // Handle routes with ID parameters
    if (currentRoute.includes('/edit-cv/')) {
      this.pageTitle = 'Éditer CV';
    } else if (currentRoute.includes('/add-reference/')) {
      this.pageTitle = 'Éditer Référence';
    } else {
      // For other ID-based routes, try to match with the base route
      const segments = currentRoute.split('/');
      const baseRoute = '/' + segments.slice(1, -1).join('/');
      
      for (const category of this.menuCategories) {
        for (const item of category.items) {
          if (baseRoute.includes(item.path.replace('/layout', ''))) {
            this.pageTitle = item.title;
            return;
          }
        }
      }
      
      this.pageTitle = 'Opportunité';
    }
  }
}
