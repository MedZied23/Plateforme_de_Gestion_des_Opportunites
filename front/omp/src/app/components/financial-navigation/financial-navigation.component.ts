import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-financial-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './financial-navigation.component.html',
  styleUrl: './financial-navigation.component.css'
})
export class FinancialNavigationComponent implements OnInit {
  @Input() propositionId: string = '';
  @Input() activeSheet: number = 1;
  
  currentUrl: string = '';

  navItems = [
    { 
      id: 7, 
      name: 'Modifier la portée', 
      icon: 'tune', 
      route: '/layout/offre-financiere'
    },
    { 
      id: 4, 
      name: 'Editer la répartition des charges', 
      icon: 'edit', 
      route: '/layout/profile-delivrable-matrix'
    },
    { 
      id: 1, 
      name: 'Répartition des charges', 
      icon: 'assessment', 
      route: '/layout/display-feuil-one'
    },
    { 
      id: 5, 
      name: 'Editer la répartition Siège/Terrain', 
      icon: 'edit', 
      route: '/layout/configure-siege-terrain'
    },
    { 
      id: 2, 
      name: 'Répartition Siège/Terrain', 
      icon: 'business', 
      route: '/layout/display-feuil-two'
    },
    { 
      id: 6, 
      name: 'Editer les paramètres des dépenses', 
      icon: 'edit', 
      route: '/layout/setting-depenses'
    },
    { 
      id: 3, 
      name: 'Coûts du Projet', 
      icon: 'attach_money', 
      route: '/layout/display-final-cost'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialize current URL and subscribe to route changes
    this.currentUrl = this.router.url.split('?')[0]; // Remove query params
    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url.split('?')[0];
    });

    // If we get a proposition ID as input, store it in localStorage for persistence
    if (this.propositionId) {
      localStorage.setItem('current_proposition_id', this.propositionId);
    } else {
      // Try to retrieve from localStorage if it's not provided as input
      const storedId = localStorage.getItem('current_proposition_id');
      if (storedId) {
        this.propositionId = storedId;
        console.log('[FinancialNavigation] Recovered propositionId from localStorage:', this.propositionId);
      } else {
        // Try to get it from query params as a last resort
        this.route.queryParams.subscribe(params => {
          if (params['propositionId']) {
            this.propositionId = params['propositionId'];
            localStorage.setItem('current_proposition_id', this.propositionId);
            console.log('[FinancialNavigation] Set propositionId from query params:', this.propositionId);
          }
        });
      }
    }
  }

  navigateTo(navItem: any): void {
    if (!this.propositionId) {
      console.error('[FinancialNavigation] No propositionId available for navigation');
      // Try to recover from localStorage
      const storedId = localStorage.getItem('current_proposition_id');
      if (storedId) {
        this.propositionId = storedId;
        console.log('[FinancialNavigation] Recovered propositionId from localStorage for navigation:', this.propositionId);
      }
    }

    // Special case for profile-delivrable-matrix route
    if (navItem.route === '/layout/profile-delivrable-matrix' && this.propositionId) {
      console.log('[FinancialNavigation] Redirecting to offre-financiere with autoConfigureHJ flag');
      // Use the same approach as in display-propositions-financieres.component.ts
      this.router.navigate(['/layout/offre-financiere'], {
        queryParams: { 
          propositionId: this.propositionId,
          autoConfigureHJ: 'true' // Add flag to auto-click the "Définir la distribution des HJ" button
        }
      });
      return;
    }

    // Default navigation for other routes
    this.router.navigate([navItem.route], {
      queryParams: { propositionId: this.propositionId }
    });
  }

  isActive(navItem: any): boolean {
    // Check if current URL matches this nav item's route
    return this.currentUrl === navItem.route || 
           // Fallback to activeSheet if URL doesn't match any route (for backward compatibility)
           (this.currentUrl.includes('/layout') && !this.navItems.some(item => item.route === this.currentUrl) && this.activeSheet === navItem.id);
  }
}
