import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { NouveauOpportuniteComponent } from './components/nouveau-opportunite/nouveau-opportunite.component';
import { DisplayOpportunitesComponent } from './components/display-opportunites/display-opportunites.component';
import { OffreFinanciereComponent } from './components/offre-financiere/offre-financiere.component';
import { LayoutComponent } from './components/layout/layout.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { RegularUserGuard } from './guards/regular-user.guard';
import { DefaultRedirectGuard } from './guards/default-redirect.guard';
import { CreateOpportunityGuard } from './guards/create-opportunity.guard';
import { CreatePropositionFinanciereGuard } from './guards/create-proposition-financiere.guard';
import { ProfileDelivrableMatrixComponent } from './components/profile-delivrable-matrix/profile-delivrable-matrix.component';
import { DisplayPropositionsFinancieresComponent } from './components/display-propositions-financieres/display-propositions-financieres.component';
import { DisplayFeuilOneComponent } from './components/display-feuil-one/display-feuil-one.component';
import { DisplayFeuilTwoComponent } from './components/display-feuil-two/display-feuil-two.component';
import { ConfigureSiegeTerrainComponent } from './components/configure-siege-terrain/configure-siege-terrain.component';
import { SettingDepensesComponent } from './components/setting-depenses/setting-depenses.component';
import { AddCvComponent } from './components/add-cv/add-cv.component';
import { SearchCvsComponent } from './components/search-cvs/search-cvs.component';
import { DisplayCvComponent } from './components/display-cv/display-cv.component';
import { DisplayCvAuditLogComponent } from './components/display-cv-audit-log/display-cv-audit-log.component';
import { DisplayFinalCostComponent } from './components/display-final-cost/display-final-cost.component';
import { AddReferenceComponent } from './components/add-reference/add-reference.component';
import { SearchReferencesComponent } from './components/search-references/search-references.component';
import { OpportunityTrackingComponent } from './components/opportunity-tracking/opportunity-tracking.component';
import { NotificationListComponent } from './components/notification-list/notification-list.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';

export const routes: Routes = [
  // Public routes (no layout with sidebar)
  { path: 'login', component: LoginComponent },
  
  // Protected routes with layout and sidebar
  {
    path: 'layout',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Regular user routes (accessible only to non-admin users)
      { path: 'nouveau-opportunite', component: NouveauOpportuniteComponent, canActivate: [RegularUserGuard, CreateOpportunityGuard] },
      { path: 'opportunites', component: DisplayOpportunitesComponent, canActivate: [RegularUserGuard] },
      { path: 'nouveau-proposition', component: OffreFinanciereComponent, canActivate: [RegularUserGuard, CreatePropositionFinanciereGuard] },
      { path: 'nouveau-cv', component: AddCvComponent, canActivate: [RegularUserGuard] },
      { path: 'nouveau-reference', component: AddReferenceComponent, canActivate: [RegularUserGuard] },
      { path: 'add-reference/:id', component: AddReferenceComponent, canActivate: [RegularUserGuard] },
      { path: 'search-cvs', component: SearchCvsComponent, canActivate: [RegularUserGuard] },
      { path: 'search-references', component: SearchReferencesComponent, canActivate: [RegularUserGuard] },
      { path: 'edit-cv/:id', component: AddCvComponent, canActivate: [RegularUserGuard] },
      { path: 'display-cv/:id', component: DisplayCvComponent, canActivate: [RegularUserGuard] },
      { path: 'cv-audit-log/:id', component: DisplayCvAuditLogComponent, canActivate: [RegularUserGuard] },
      { path: 'offre-financiere', component: OffreFinanciereComponent, canActivate: [RegularUserGuard, CreatePropositionFinanciereGuard] },
      { path: 'profile-delivrable-matrix', component: ProfileDelivrableMatrixComponent, canActivate: [RegularUserGuard] },
      { path: 'display-feuil-one', component: DisplayFeuilOneComponent, canActivate: [RegularUserGuard] },
      { path: 'display-feuil-two', component: DisplayFeuilTwoComponent, canActivate: [RegularUserGuard] },
      { path: 'propositions-financieres', component: DisplayPropositionsFinancieresComponent, canActivate: [RegularUserGuard] },
      { path: 'configure-siege-terrain', component: ConfigureSiegeTerrainComponent, canActivate: [RegularUserGuard] },
      { path: 'setting-depenses', component: SettingDepensesComponent, canActivate: [RegularUserGuard] },
      { path: 'display-final-cost', component: DisplayFinalCostComponent, canActivate: [RegularUserGuard] },
      { path: 'opportunity-tracking/:id', component: OpportunityTrackingComponent, canActivate: [RegularUserGuard] },
      { path: 'notifications', component: NotificationListComponent, canActivate: [RegularUserGuard] },
        // Admin routes (accessible only to admin users)
      { path: 'admin/users', component: AdminUserManagementComponent, canActivate: [AdminGuard] },
      
      // Default redirect based on user role
      { path: '', canActivate: [DefaultRedirectGuard], children: [] }
    ]
  },
  
  // Fallback route
  { path: '**', redirectTo: 'login' }
];