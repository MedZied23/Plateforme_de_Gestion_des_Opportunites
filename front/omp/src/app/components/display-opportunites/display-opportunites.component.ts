import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OpportuniteService, OpportuniteDto } from '../../services/opportunite.service';
import { PermissionService } from '../../services/permission.service';
import { TaskOpportuniteService } from '../../services/task-opportunite.service';
import { TaskOpportuniteDto } from '../../models/task-opportunite.interface';
import { Nature } from '../../enums/nature.enum';
import { StatutTache } from '../../enums/statut-tache.enum';
import { Observable, combineLatest, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-display-opportunites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-opportunites.component.html',
  styleUrl: './display-opportunites.component.css'
})
export class DisplayOpportunitesComponent implements OnInit {
  opportunities: OpportuniteDto[] = [];
  canCreateOpportunity$: Observable<boolean>;
  opportunityProgress: { [key: string]: number } = {}; // Store progress by opportunity ID

  constructor(
    private opportuniteService: OpportuniteService,
    private permissionService: PermissionService,
    private taskService: TaskOpportuniteService,
    private router: Router
  ) {
    this.canCreateOpportunity$ = this.permissionService.canCreateOpportunity();
  }
  ngOnInit(): void {
    this.loadOpportunities();
  }

  loadOpportunities(): void {
    this.opportuniteService.getOpportunites().subscribe({
      next: (data) => {
        console.log('Raw API response:', data);
        
        // Check if data is a paginated response
        if (data && typeof data === 'object' && 'items' in data) {
          // If paginated, use the items array
          this.opportunities = (data as any).items;
        } else {
          // If not paginated, use the data as is
          this.opportunities = data;
        }
        
        console.log('Processed opportunities:', {
          length: this.opportunities.length,
          isEmpty: this.opportunities.length === 0,
          firstOpportunity: this.opportunities[0]
        });

        // Load progress for each opportunity
        this.loadOpportunityProgress();
      },
      error: (error) => {
        console.error('Error loading opportunities:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
      }
    });
  }

  private loadOpportunityProgress(): void {
    // Create observables for each opportunity's tasks
    const progressObservables = this.opportunities.map(opportunity => 
      this.taskService.getTasksByOpportuniteId(opportunity.id).pipe(
        map(tasks => ({
          opportunityId: opportunity.id,
          progress: this.calculateOpportunityProgress(tasks, opportunity)
        })),
        catchError(error => {
          console.error(`Error loading tasks for opportunity ${opportunity.id}:`, error);
          return of({
            opportunityId: opportunity.id,
            progress: 0
          });
        })
      )
    );

    // Execute all observables in parallel
    if (progressObservables.length > 0) {
      forkJoin(progressObservables).subscribe({
        next: (results) => {
          // Store progress for each opportunity
          results.forEach(result => {
            this.opportunityProgress[result.opportunityId] = result.progress;
          });
        },
        error: (error) => {
          console.error('Error loading opportunity progress:', error);
        }
      });
    }
  }

  private calculateOpportunityProgress(tasks: TaskOpportuniteDto[], opportunity: OpportuniteDto): number {
    if (!tasks || tasks.length === 0) {
      return 0;
    }

    const TYPE_ADMINISTRATIVE = 1;
    const TYPE_OPERATIONAL = 0;
    
    // Filter operational tasks based on opportunity nature (same logic as tracking component)
    const operationalTasks = tasks.filter(task => {
      if (task.type !== TYPE_OPERATIONAL) {
        return false; // Not an operational task
      }
      
      // Convert task nature to number to ensure proper comparison
      const taskNature = typeof task.nature === 'number' ? task.nature : Number(task.nature);
      
      // Filter by opportunity nature:
      // AMI (Nature.AMI = 0) should match tasks with nature 0
      // Propale (Nature.Propale = 1) should match tasks with nature 1
      if (opportunity.nature === Nature.AMI) {
        return taskNature === 0; // AMI tasks
      } else if (opportunity.nature === Nature.Propale) {
        return taskNature === 1; // Propale tasks
      } else {
        // For other natures (like Pitch), include all operational tasks
        return true;
      }
    });
    
    // Administrative tasks are always included regardless of nature
    const administrativeTasks = tasks.filter(task => task.type === TYPE_ADMINISTRATIVE);
    
    // Combine operational tasks (filtered by nature) and administrative tasks
    const allRelevantTasks = [...operationalTasks, ...administrativeTasks];
    
    const totalPercentage = allRelevantTasks.reduce((sum, task) => sum + task.percentage, 0);
    const completedPercentage = allRelevantTasks
      .filter(task => {
        // For administrative tasks, check the statut attribute
        if (task.type === TYPE_ADMINISTRATIVE) {
          return task.statut === StatutTache.Done;
        }
        // For operational tasks, use the done boolean
        return task.done;
      })
      .reduce((sum, task) => sum + task.percentage, 0);

    return totalPercentage > 0 ? Math.round((completedPercentage / totalPercentage) * 100) : 0;
  }

  getOpportunityProgress(opportunityId: string): number {
    return this.opportunityProgress[opportunityId] || 0;
  }

  getNatureLabel(nature: Nature | undefined): string {
    if (nature === undefined) return '';
    switch (nature) {
      case Nature.AMI:
        return 'AMI';
      case Nature.Propale:
        return 'Propale';
      case Nature.Pitch:
        return 'Pitch';
      default:
        return 'Unknown';
    }
  }
  editOpportunity(opportunity: OpportuniteDto): void {
    this.router.navigate(['/layout/nouveau-opportunite'], {
      queryParams: { id: opportunity.id }
    });
  }

  navigateToTracking(opportunity: OpportuniteDto): void {
    this.router.navigate(['/layout/opportunity-tracking', opportunity.id]);
  }

  deleteOpportunity(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
      this.opportuniteService.deleteOpportunite(id).subscribe({
        next: () => {
          this.loadOpportunities();
        },
        error: (error) => {
          console.error('Error deleting opportunity:', error);
        }
      });
    }
  }

  // Check if user can edit a specific opportunity
  canEditOpportunity(opportunity: OpportuniteDto): Observable<boolean> {
    return this.permissionService.canEditOpportunity(opportunity);
  }

  // Check if user can delete a specific opportunity
  canDeleteOpportunity(opportunity: OpportuniteDto): Observable<boolean> {
    return this.permissionService.canDeleteOpportunity(opportunity);
  }

  createOpportunity(): void {
    this.router.navigate(['/layout/nouveau-opportunite']);
  }
}
