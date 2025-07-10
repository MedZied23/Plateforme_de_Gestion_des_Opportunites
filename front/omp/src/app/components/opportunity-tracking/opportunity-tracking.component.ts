import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { firstValueFrom } from 'rxjs';
import { TaskOpportuniteService } from '../../services/task-opportunite.service';
import { TaskNameService } from '../../services/task-name.service';
import { OpportuniteService, OpportuniteDto } from '../../services/opportunite.service';
import { UserService, UserDto } from '../../services/user.service';
import { ClientService } from '../../services/client.service';
import { PartenaireService, TypePartenaire } from '../../services/partenaire.service';
import { BailleurDeFondsService } from '../../services/bailleur-fonds.service';
import { AuthService } from '../../services/auth.service';
import { TaskOpportuniteDto } from '../../models/task-opportunite.interface';
import { TaskType } from '../../enums/task-type.enum';
import { TaskName } from '../../enums/task-name.enum';
import { Nature } from '../../enums/nature.enum';
import { StatutTache } from '../../enums/statut-tache.enum';
import { Status } from '../../enums/status.enum';
import { TaskAssignmentDialogComponent } from '../task-assignment-dialog/task-assignment-dialog.component';
import { TaskCreationDialogComponent } from '../task-creation-dialog/task-creation-dialog.component';
import { ValidationDialogComponent, ValidationDialogData } from '../validation-dialog/validation-dialog.component';

// Constants for type and nature matching
const TYPE_ADMINISTRATIVE = 1;  // TaskType.Administrative
const TYPE_OPERATIONAL = 0;    // TaskType.Operational
const NATURE_AMI = 0;         // Nature.AMI
const NATURE_PROPALE = 1;     // Nature.Propale

// Interface for member tickets
interface MemberTicket {
  name: string;
  fullName: string;
  role: string;
  completed: boolean;
  userId: string;
}

@Component({
  selector: 'app-opportunity-tracking',  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './opportunity-tracking.component.html',
  styleUrl: './opportunity-tracking.component.css'
})
export class OpportunityTrackingComponent implements OnInit, AfterViewInit, OnDestroy {
  activeView: 'suivi' | 'informations' | 'decision' = 'suivi';  opportunityId: string | null = null;
  currentOpportunity: OpportuniteDto | null = null;
  tasks: TaskOpportuniteDto[] = [];
    administrativeTasks: TaskOpportuniteDto[] = [];
  operationalTasksAMI: TaskOpportuniteDto[] = [];
  operationalTasksPropale: TaskOpportuniteDto[] = [];
  currentUserTasks: TaskOpportuniteDto[] = [];  // Current opportunity team members
  associeEnCharge: UserDto | null = null;
  managerEnCharge: UserDto | null = null;
  coManagerEnCharge: UserDto | null = null;
  seniorManagerEnCharge: UserDto | null = null;
  equipeProjet: UserDto[] = [];
  // Additional data for informations view
  client: any | null = null;
  partenaires: any[] = [];
  bailleursF: any[] = [];  isCurrentUserManager: boolean = false;
  currentUserId: string | null = null;  // Loading states
  loadingTaskIds: Set<string> = new Set();
  isValidationLoading: boolean = false;
  
  // Decision functionality
  decisionComment: string = '';
  isDecisionLoading: boolean = false;
  
  // Progress animation
  animatedProgressPercentage: number = 0;
  private animationId: number | null = null;
  private tasksLoaded: boolean = false;
  private opportunityLoaded: boolean = false;
  
  // Expose Math to template
  Math = Math;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskOpportuniteService,
    private taskNameService: TaskNameService,
    private opportuniteService: OpportuniteService,
    private userService: UserService,
    private clientService: ClientService,
    private partenaireService: PartenaireService,
    private bailleurDeFondsService: BailleurDeFondsService,
    private authService: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Verify enum constants match actual enum values
    console.log('=== ENUM VERIFICATION ===');
    console.log('TaskType enum values:', {
      Operational: TaskType.Operational,
      Administrative: TaskType.Administrative
    });
    console.log('Nature enum values:', {
      AMI: Nature.AMI,
      Propale: Nature.Propale,
      Pitch: Nature.Pitch
    });
    console.log('Component constants:', {
      TYPE_ADMINISTRATIVE,
      TYPE_OPERATIONAL,
      NATURE_AMI,
      NATURE_PROPALE
    });
    console.log('Constants match enums:', {
      adminMatch: TYPE_ADMINISTRATIVE === TaskType.Administrative,
      operationalMatch: TYPE_OPERATIONAL === TaskType.Operational,
      amiMatch: NATURE_AMI === Nature.AMI,
      propaleMatch: NATURE_PROPALE === Nature.Propale
    });
    console.log('=== END ENUM VERIFICATION ===\n');

    this.opportunityId = this.route.snapshot.paramMap.get('id');
    
    // Check if we should automatically switch to decision tab from URL fragment
    const fragment = this.route.snapshot.fragment;
    if (fragment === 'decision') {
      this.activeView = 'decision';
    }
    
    if (this.opportunityId) {
      // Load both tasks and opportunity data
      Promise.all([
        this.loadTasks(this.opportunityId),
        this.loadOpportunityData(this.opportunityId)
      ]).catch(error => {
        console.error('Error initializing component:', error);
      });
    }
  }  ngAfterViewInit(): void {
    // Animation will be started after data is loaded, not here
  }
  private startProgressAnimation(): void {
    // Cancel any existing animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Reset to 0 to start animation from beginning
    this.animatedProgressPercentage = 0;
    
    const targetPercentage = this.getCurrentOperationalProgress().percentage;
    const animationDuration = 800; // 800ms animation
    const frameRate = 60; // 60fps
    const totalFrames = (animationDuration / 1000) * frameRate;
    const increment = targetPercentage / totalFrames;
    
    let currentFrame = 0;
    
    const animate = () => {
      if (currentFrame < totalFrames) {
        this.animatedProgressPercentage = Math.min(increment * currentFrame, targetPercentage);
        currentFrame++;
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animatedProgressPercentage = targetPercentage;
        this.animationId = null;
      }
      this.cdr.detectChanges();
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  private loadTasks(opportunityId: string): void {
    this.taskService.getTasksByOpportuniteId(opportunityId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        console.log('Fetched tasks from backend:', tasks);
        
        // Enhanced debugging: Check raw data types and values
        console.log('Raw task data analysis:');        tasks.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, {
            id: task.id,
            name: TaskName[task.name] + ' (' + this.getTaskName(task.name) + ')',
            type: {
              raw: task.type,
              typeof: typeof task.type,
              asNumber: Number(task.type),
              isNaN: isNaN(Number(task.type))
            },
            nature: {
              raw: task.nature,
              typeof: typeof task.nature,
              asNumber: Number(task.nature),
              isNaN: isNaN(Number(task.nature))
            },
            done: task.done,
            percentage: task.percentage
          });        });
        
        this.categorizeTasks();
        this.tasksLoaded = true;
        
        // Check if we can start the animation
        this.checkAndStartAnimation();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }  private categorizeTasks(): void {
    // Reset arrays
    this.administrativeTasks = [];
    this.operationalTasksAMI = [];
    this.operationalTasksPropale = [];
    this.currentUserTasks = [];

    console.log('=== TASK CATEGORIZATION DEBUG ===');
    console.log('Total tasks to categorize:', this.tasks.length);
    console.log('Expected constants:', {
      TYPE_ADMINISTRATIVE: 1,
      TYPE_OPERATIONAL: 0,
      NATURE_AMI: 0,
      NATURE_PROPALE: 1
    });
    console.log('Current user ID:', this.currentUserId);

    // Categorize tasks
    this.tasks.forEach((task, index) => {
      // Convert type to number if it's not already
      const taskType = typeof task.type === 'number' ? task.type : Number(task.type);
      const taskNature = typeof task.nature === 'number' ? task.nature : Number(task.nature);      console.log(`\n--- Processing Task ${index + 1} ---`);
      console.log('Task ID:', task.id);
      console.log('Task Name:', this.taskNameService.getDebugTaskName(task.name));
      console.log('Raw Type:', task.type, '| Converted Type:', taskType);
      console.log('Raw Nature:', task.nature, '| Converted Nature:', taskNature);
      console.log('Task team (equipe):', task.equipe);      // Check if current user is assigned to this task
      const isAssignedToCurrentUser = this.currentUserId && task.equipe && 
        typeof task.equipe === 'object' && this.currentUserId in task.equipe;
      
      // Only add operational tasks that match the current opportunity nature to currentUserTasks
      if (isAssignedToCurrentUser && taskType === 0) { // Only operational tasks
        const currentNature = this.currentOpportunity?.nature;
        
        // Only add if task nature matches current opportunity nature
        if ((currentNature === Nature.AMI && taskNature === 0) || 
            (currentNature === Nature.Propale && taskNature === 1)) {
          console.log('✓ Task is assigned to current user and matches opportunity nature');
          this.currentUserTasks.push(task);
        } else {
          console.log('✗ Task assigned to user but nature doesn\'t match opportunity:', {
            opportunityNature: currentNature,
            taskNature: taskNature
          });
        }
      }
      
      // Detailed decision logic
      if (taskType === 1) { // Administrative
        console.log('✅ DECISION: Adding to ADMINISTRATIVE tasks (type === 1)');
        this.administrativeTasks.push(task);
      } else if (taskType === 0) { // Operational
        console.log('✅ DECISION: Task is OPERATIONAL (type === 0)');
        console.log('   Nature check - Raw:', task.nature, 'Converted:', taskNature);
        
        if (taskNature === 0) { // AMI
          console.log('   ✅ SUB-DECISION: Adding to AMI tasks (nature === 0)');
          this.operationalTasksAMI.push(task);
        } else if (taskNature === 1) { // Propale
          console.log('   ✅ SUB-DECISION: Adding to PROPALE tasks (nature === 1)');
          this.operationalTasksPropale.push(task);
        } else {
          console.log('   ❌ SUB-DECISION: Unknown nature for operational task:', taskNature);
        }
      } else {
        console.log('❌ DECISION: Unknown task type:', taskType);
      }
    });

    // Final results
    console.log('\n=== CATEGORIZATION RESULTS ===');    console.log('Administrative Tasks:', {
      count: this.administrativeTasks.length,
      tasks: this.administrativeTasks.map(t => ({ 
        id: t.id, 
        name: TaskName[t.name] + ' (' + this.getTaskName(t.name) + ')',
        type: t.type,
        nature: t.nature
      }))
    });    console.log('AMI Tasks:', {
      count: this.operationalTasksAMI.length,
      tasks: this.operationalTasksAMI.map(t => ({ 
        id: t.id, 
        name: TaskName[t.name] + ' (' + this.getTaskName(t.name) + ')',
        type: t.type,
        nature: t.nature
      }))
    });    console.log('Propale Tasks:', {
      count: this.operationalTasksPropale.length,
      tasks: this.operationalTasksPropale.map(t => ({ 
        id: t.id, 
        name: TaskName[t.name] + ' (' + this.getTaskName(t.name) + ')',
        type: t.type,
        nature: t.nature
      }))
    });    console.log('Current User Tasks:', {
      count: this.currentUserTasks.length,
      tasks: this.currentUserTasks.map(t => ({ 
        id: t.id, 
        name: TaskName[t.name] + ' (' + this.getTaskName(t.name) + ')',
        type: t.type,
        nature: t.nature,
        assigned: t.equipe
      }))
    });
    console.log('=== END CATEGORIZATION DEBUG ===\n');  }

  private async loadOpportunityData(opportunityId: string) {
    try {
      const opportunity = await firstValueFrom(this.opportuniteService.getOpportuniteById(opportunityId));
      if (!opportunity) {
        console.error('Opportunity not found');
        return;
      }

      // Store the opportunity for nature checking
      this.currentOpportunity = opportunity;

      // Load team members data
      const [associe, manager, coManager, seniorManager, equipe] = await Promise.all([
        opportunity.associeEnCharge ? firstValueFrom(this.userService.getUserById(opportunity.associeEnCharge)) : Promise.resolve(null),
        opportunity.managerEnCharge ? firstValueFrom(this.userService.getUserById(opportunity.managerEnCharge)) : Promise.resolve(null),
        opportunity.coManagerEnCharge ? firstValueFrom(this.userService.getUserById(opportunity.coManagerEnCharge)) : Promise.resolve(null),
        opportunity.seniorManagerEnCharge ? firstValueFrom(this.userService.getUserById(opportunity.seniorManagerEnCharge)) : Promise.resolve(null),
        Promise.all((opportunity.equipeProjet || []).map(id => firstValueFrom(this.userService.getUserById(id)).catch(() => null)))
      ]);

      this.associeEnCharge = associe;
      this.managerEnCharge = manager;
      this.coManagerEnCharge = coManager;
      this.seniorManagerEnCharge = seniorManager;
      this.equipeProjet = equipe.filter((user): user is UserDto => user !== null);

      // Load additional data for informations view
      await this.loadAdditionalInformationsData(opportunity);      // Get the current user from the decoded JWT token
      const decodedToken = this.authService.getDecodedToken();
      if (decodedToken) {
        // The token should contain the user's ID 
        const currentUserId = decodedToken.nameid || decodedToken.sub;
        this.currentUserId = currentUserId;
        console.log('Current user ID stored:', this.currentUserId);

        // Check if current user is manager, co-manager, or senior manager
        const isManager = currentUserId === opportunity.managerEnCharge;
        const isCoManager = currentUserId === opportunity.coManagerEnCharge;
        const isSeniorManager = currentUserId === opportunity.seniorManagerEnCharge;
        
        console.log('Checking manager rights:', {
          currentUserId,
          managerEnChargeId: opportunity.managerEnCharge,
          coManagerEnChargeId: opportunity.coManagerEnCharge,
          seniorManagerEnChargeId: opportunity.seniorManagerEnCharge,
          isManager,
          isCoManager,
          isSeniorManager,
          hasEditRights: isManager || isCoManager
        });
        
        // Only manager and co-manager have edit permissions
        // Senior manager has view-only access like associé and équipe projet
        this.isCurrentUserManager = isManager || isCoManager;
          // Re-categorize tasks now that we have the current user ID
        if (this.tasks.length > 0) {
          this.categorizeTasks();
        }
      }
      
      // Mark opportunity as loaded and check if animation can start
      this.opportunityLoaded = true;
      this.checkAndStartAnimation();
    } catch (error) {
      console.error('Error loading opportunity data:', error);
    }
  }private async loadAdditionalInformationsData(opportunity: OpportuniteDto) {
    try {
      // Load client data if clientId exists
      if (opportunity.clientId) {
        // Since there's no getClientById, load all clients and find the one we need
        const clients = await firstValueFrom(this.clientService.getClients());
        this.client = clients.find((c: any) => c.id === opportunity.clientId) || null;
      }

      // Load partners data if partenaireId exists
      if (opportunity.partenaireId && opportunity.partenaireId.length > 0) {
        const partnersPromises = opportunity.partenaireId.map((id: string) => 
          firstValueFrom(this.partenaireService.getPartenaireById(id)).catch(() => null)
        );
        const partners = await Promise.all(partnersPromises);
        this.partenaires = partners.filter((p: any) => p !== null);
      }

      // Load bailleurs de fonds data if idBailleurDeFonds exist
      if (opportunity.idBailleurDeFonds && opportunity.idBailleurDeFonds.length > 0) {
        // Since there's no getBailleurById, load all bailleurs and filter
        const allBailleurs = await firstValueFrom(this.bailleurDeFondsService.getBailleursDeFonds());
        this.bailleursF = allBailleurs.filter((b: any) => opportunity.idBailleurDeFonds!.includes(b.id));
      }
    } catch (error) {
      console.error('Error loading additional informations data:', error);
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      console.error('Error decoding token:', error);
      return {};
    }
  }
  async openTaskAssignment(task: TaskOpportuniteDto) {    // Debug logging for authorization
    const decodedToken = this.authService.getDecodedToken();
    console.log('Opening task assignment:', {
      taskId: task.id,
      taskType: task.type,
      isCurrentUserManager: this.isCurrentUserManager,
      token: {
        userId: decodedToken?.nameid || decodedToken?.sub,
        claims: decodedToken
      },
      managerEnChargeId: this.managerEnCharge?.id,
      coManagerEnChargeId: this.coManagerEnCharge?.id
    });

    // Only show assignment dialog for operational tasks
    if (task.type === TaskType.Administrative) {
      return;
    }    const dialogRef = this.dialog.open(TaskAssignmentDialogComponent, {
      data: {
        task,
        associeEnCharge: this.associeEnCharge,
        managerEnCharge: this.managerEnCharge,
        coManagerEnCharge: this.coManagerEnCharge,
        seniorManagerEnCharge: this.seniorManagerEnCharge,
        equipeProjet: this.equipeProjet,
        canAssign: this.isCurrentUserManager
      },
      width: '500px'
    });const result = await dialogRef.afterClosed().toPromise();
    if (result && this.isCurrentUserManager) {
      await this.updateTaskAssignment(task.id, result.assignedMembers, result.deadline);      // Reload tasks after successful update
      if (this.opportunityId) {
        this.loadTasks(this.opportunityId);
        // Animation will be restarted in loadTasks method
      }
    }
  }  async toggleTaskDone(task: TaskOpportuniteDto) {
    // Only allow managers and co-managers to toggle task status
    if (!this.isCurrentUserManager) {
      console.warn('Only managers and co-managers can mark tasks as done');
      return;
    }

    // Prevent multiple clicks while processing
    if (this.loadingTaskIds.has(task.id)) {
      return;
    }    // Store original status for potential rollback
    const originalStatus = task.done;
    const originalEquipe = task.equipe ? { ...task.equipe } : null;
    const newDoneStatus = !task.done;

    try {
      // Set loading state
      this.loadingTaskIds.add(task.id);
        console.log('Toggling task done status:', {
        taskId: task.id,
        taskName: TaskName[task.name] + ' (' + this.getTaskName(task.name) + ')',
        previousStatus: originalStatus,
        newStatus: newDoneStatus,
        isCurrentUserManager: this.isCurrentUserManager
      });      // Update UI immediately for better user experience
      task.done = newDoneStatus;
      
      // When marking task as done/undone, update all team members' completion status accordingly
      if (task.equipe && typeof task.equipe === 'object' && Object.keys(task.equipe).length > 0) {
        const updatedEquipe = { ...task.equipe };
        Object.keys(updatedEquipe).forEach(memberId => {
          updatedEquipe[memberId] = newDoneStatus; // Set all members to the same status as the task
        });
        task.equipe = updatedEquipe;
      }
      
      // Update the task in our local arrays immediately for real-time progress
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            done: newDoneStatus,
            equipe: task.equipe // Include updated equipe
          };
        }
      });
      
      // Also update the main tasks array immediately
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          done: newDoneStatus,
          equipe: task.equipe // Include updated equipe
        };
      }
      
      // Trigger immediate progress bar animation for real-time feedback
      this.startProgressAnimation();
      this.cdr.detectChanges();      const updatedTaskData: TaskOpportuniteDto = {
        ...task,
        done: newDoneStatus,
        equipe: task.equipe // Include updated equipe dictionary
      };

      // Update the task via the service
      const updatedTask = await firstValueFrom(this.taskService.updateTask(task.id, updatedTaskData));
      
      if (updatedTask) {
        // Backend update successful - no need to update arrays again since we already did it above
        // Just ensure UI consistency
        this.cdr.detectChanges();
        
        console.log('Task status updated successfully:', {
          taskId: task.id,
          newStatus: newDoneStatus
        });
      }    } catch (error) {
      console.error('Error toggling task done status:', error);
      
      // Revert the UI change if the backend update failed
      task.done = originalStatus;
      if (originalEquipe) {
        task.equipe = originalEquipe;
      }
      
      // Revert the changes in all arrays
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            done: originalStatus,
            ...(originalEquipe && { equipe: originalEquipe })
          };
        }
      });
      
      // Also revert the main tasks array
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          done: originalStatus,
          ...(originalEquipe && { equipe: originalEquipe })
        };
      }
        // Restart progress animation to reflect the reverted state
      this.startProgressAnimation();
      this.cdr.detectChanges();
      
      // You could also show a user-friendly error message here
      alert('Erreur lors de la mise à jour du statut de la tâche. Veuillez réessayer.');
    } finally {
      // Remove loading state
      this.loadingTaskIds.delete(task.id);
      this.cdr.detectChanges();
    }
  }

  isTaskLoading(taskId: string): boolean {
    return this.loadingTaskIds.has(taskId);
  }

  private async updateTaskAssignment(taskId: string, assignedMembers: string[], deadline?: Date | null) {
    try {
      // First get the current task
      const currentTask = await firstValueFrom(this.taskService.getTaskById(taskId));
      if (!currentTask) {
        console.error('Task not found');
        return;
      }      // Prepare the update data
      const updateData: any = {
        ...currentTask,
        equipe: this.convertMemberArrayToDictionary(assignedMembers),
        dateAssigned: assignedMembers.length > 0 ? new Date() : currentTask.dateAssigned
      };

      // Add deadline if provided
      if (deadline !== undefined) {
        updateData.dateDone = deadline;
      }

      // Update the task with new team members, assignment date, and deadline
      const updatedTask = await firstValueFrom(this.taskService.updateTask(taskId, updateData));        if (updatedTask) {
        // Update the task in our lists
        [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
          const index = list.findIndex(t => t.id === taskId);
          if (index !== -1) {
            list[index] = { 
              ...list[index], 
              equipe: updatedTask.equipe,
              dateAssigned: updatedTask.dateAssigned,
              dateDone: updatedTask.dateDone
            };
          }
        });
          // Re-categorize tasks to update current user tasks array
        this.categorizeTasks();
        
        // Restart progress bar animation to reflect any changes in task completion
        this.startProgressAnimation();
      }
    } catch (error) {
      console.error('Error updating task assignment:', error);
    }
  }  getAssignedMembers(task: TaskOpportuniteDto): string {
    const memberIds = this.getAssignedMemberIds(task);
    if (memberIds.length === 0) {
      return 'Non assigné';
    }

    const members = memberIds.map(id => {
      if (this.associeEnCharge?.id === id) {
        return `${this.associeEnCharge.prenom} ${this.associeEnCharge.nom}`;
      }
      if (this.managerEnCharge?.id === id) {
        return `${this.managerEnCharge.prenom} ${this.managerEnCharge.nom}`;
      }
      if (this.coManagerEnCharge?.id === id) {
        return `${this.coManagerEnCharge.prenom} ${this.coManagerEnCharge.nom}`;
      }
      if (this.seniorManagerEnCharge?.id === id) {
        return `${this.seniorManagerEnCharge.prenom} ${this.seniorManagerEnCharge.nom}`;
      }
      const member = this.equipeProjet.find(m => m.id === id);
      return member ? `${member.prenom} ${member.nom}` : 'Membre inconnu';
    });

    return members.join(', ');
  }getAssignedMembersAsTickets(task: TaskOpportuniteDto): MemberTicket[] {
    const memberIds = this.getAssignedMemberIds(task);
    if (memberIds.length === 0) {
      return [];
    }

    const members = memberIds.map(id => {
      let fullName = '';
      let role = '';
        if (this.associeEnCharge?.id === id) {
        fullName = `${this.associeEnCharge?.prenom} ${this.associeEnCharge?.nom}`;
        role = 'Associé en charge';
      } else if (this.managerEnCharge?.id === id) {
        fullName = `${this.managerEnCharge?.prenom} ${this.managerEnCharge?.nom}`;
        role = 'Manager en charge';
      } else if (this.coManagerEnCharge?.id === id) {
        fullName = `${this.coManagerEnCharge?.prenom} ${this.coManagerEnCharge?.nom}`;
        role = 'Co-manager en charge';
      } else if (this.seniorManagerEnCharge?.id === id) {
        fullName = `${this.seniorManagerEnCharge?.prenom} ${this.seniorManagerEnCharge?.nom}`;
        role = 'Senior Manager en charge';
      } else {
        const member = this.equipeProjet.find(m => m.id === id);
        if (member) {
          fullName = `${member.prenom} ${member.nom}`;
          role = 'Équipe projet';
        } else {
          fullName = 'Membre inconnu';
          role = 'Inconnu';
        }
      }      return {
        name: fullName, // Use full name instead of initials
        fullName,
        role,
        completed: this.getUserTaskCompletionStatus(task, id),
        userId: id
      };
    });

    return members;
  }getTaskName(taskName: TaskName): string {
    return this.taskNameService.getFrenchTaskName(taskName);
  }
  hasAssignedMembers(task: TaskOpportuniteDto): boolean {
    return task.type === TaskType.Operational && task.equipe && this.getAssignedMemberIds(task).length > 0;
  }

  shouldShowAMIColumn(): boolean {
    return this.currentOpportunity?.nature === Nature.AMI;
  }
  shouldShowPropaleColumn(): boolean {
    return this.currentOpportunity?.nature === Nature.Propale;
  }

  getRemainingDays(deadline: string | Date | null): number | null {
    if (!deadline) {
      return null;
    }
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  }

  getRemainingDaysText(deadline: string | Date | null): string {
    const remainingDays = this.getRemainingDays(deadline);
    
    if (remainingDays === null) {
      return 'Aucune échéance';
    }
    
    if (remainingDays < 0) {
      const overdueDays = Math.abs(remainingDays);
      return `En retard de ${overdueDays} jour${overdueDays > 1 ? 's' : ''}`;
    } else if (remainingDays === 0) {
      return 'Aujourd\'hui';
    } else if (remainingDays === 1) {
      return 'Demain';
    } else {
      return `${remainingDays} jours restants`;
    }
  }  // Get deadline text considering task completion status (for "Mes Tâches" column)
  getRemainingDaysTextForUserTask(task: TaskOpportuniteDto): string {
    const remainingDays = this.getRemainingDays(task.dateDone || null);
    
    if (remainingDays === null) {
      return 'Aucune échéance';
    }
      // For completed tasks, show nothing regardless of deadline status
    if (task.done) {
      return ''; // Show nothing for all completed tasks
    }
    
    // For incomplete tasks, show standard deadline text
    if (remainingDays < 0) {
      const overdueDays = Math.abs(remainingDays);
      return `En retard de ${overdueDays} jour${overdueDays > 1 ? 's' : ''}`;
    } else if (remainingDays === 0) {
      return 'Aujourd\'hui';
    } else if (remainingDays === 1) {
      return 'Demain';
    } else {
      return `${remainingDays} jours restants`;
    }
  }

  // Check if an operational task is overdue
  isTaskOverdue(task: TaskOpportuniteDto): boolean {
    // Only check operational tasks that are not done and have assigned members
    if (task.type !== TYPE_OPERATIONAL || task.done || !this.hasAssignedMembers(task)) {
      return false;
    }
    
    // Check if task has a deadline and if it's overdue
    const remainingDays = this.getRemainingDays(task.dateDone || null);
    return remainingDays !== null && remainingDays < 0;
  }
  // Progress tracking methods
  getCurrentOperationalProgress(): { completed: number; total: number; percentage: number; phaseName: string } {
    let currentPhaseTasks: TaskOpportuniteDto[] = [];
    let phaseName = '';
    
    // Determine which operational phase we're currently in based on opportunity nature
    if (this.currentOpportunity?.nature === Nature.AMI) {
      currentPhaseTasks = this.operationalTasksAMI;
      phaseName = "Phase d'avancement de l'opportunité";
    } else if (this.currentOpportunity?.nature === Nature.Propale) {
      currentPhaseTasks = this.operationalTasksPropale;
      phaseName = "Phase d'avancement de l'opportunité";
    } else {
      // If no specific nature or mixed, show all operational tasks
      currentPhaseTasks = [...this.operationalTasksAMI, ...this.operationalTasksPropale];
      phaseName = "Phase d'avancement de l'opportunité";
    }
    
    // Include administrative tasks in overall progress calculation
    const allTasks = [...currentPhaseTasks, ...this.administrativeTasks];
    
    const totalPercentage = allTasks.reduce((sum, task) => sum + task.percentage, 0);
    const completedPercentage = allTasks
      .filter(task => {
        // For administrative tasks, check the new statut attribute
        if (task.type === TYPE_ADMINISTRATIVE) {
          return this.isAdministrativeTaskDone(task);
        }
        // For operational tasks, use the done boolean
        return task.done;
      })
      .reduce((sum, task) => sum + task.percentage, 0);
    
    const progressPercentage = totalPercentage > 0 ? Math.round((completedPercentage / totalPercentage) * 100) : 0;
    
    return {
      completed: completedPercentage,
      total: totalPercentage,
      percentage: progressPercentage,
      phaseName: phaseName
    };
  }// Sorting method for current user tasks
  getSortedCurrentUserTasks(): TaskOpportuniteDto[] {
    console.log('Getting sorted current user tasks:', {
      totalCurrentUserTasks: this.currentUserTasks.length,
      opportunityNature: this.currentOpportunity?.nature,
      currentUserId: this.currentUserId
    });
    
    return [...this.currentUserTasks].sort((a, b) => {      // Determine task priorities (1 = highest priority)
      const getPriority = (task: TaskOpportuniteDto): number => {
        // Priority 3: Done tasks (always lowest priority regardless of deadline)
        if (task.done) {
          return 3;
        }
        
        const remainingDays = this.getRemainingDays(task.dateDone || null);
        
        // Priority 1: Delayed tasks (overdue) - only for incomplete tasks
        if (remainingDays !== null && remainingDays < 0) {
          return 1;
        }
        
        // Priority 2: Assigned but not done and not overdue
        return 2;
      };
      
      const aPriority = getPriority(a);
      const bPriority = getPriority(b);
      
      // First sort by priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Within same priority, sort by numero
      return a.numero - b.numero;
    });
  }

  ngOnDestroy(): void {
  // Clean up any running animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  private checkAndStartAnimation(): void {
    // Only start animation when both tasks and opportunity data are loaded
    if (this.tasksLoaded && this.opportunityLoaded) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        this.startProgressAnimation();
      }, 50);
    }
  }

  // ===== NEW METHODS FOR STATUT HANDLING =====

  // Get the statut for administrative tasks (with fallback to done boolean)
  getTaskStatut(task: TaskOpportuniteDto): StatutTache {
    // For administrative tasks, use the new statut field if available
    if (task.type === TYPE_ADMINISTRATIVE && task.statut !== undefined) {
      return task.statut;
    }
    
    // Fallback to done boolean for backward compatibility
    return task.done ? StatutTache.Done : StatutTache.NotStarted;
  }

  // Check if administrative task is done (statut === Done)
  isAdministrativeTaskDone(task: TaskOpportuniteDto): boolean {
    if (task.type === TYPE_ADMINISTRATIVE) {
      return this.getTaskStatut(task) === StatutTache.Done;
    }
    return task.done; // Fallback for operational tasks
  }

  // Check if administrative task is in progress
  isAdministrativeTaskInProgress(task: TaskOpportuniteDto): boolean {
    if (task.type === TYPE_ADMINISTRATIVE) {
      return this.getTaskStatut(task) === StatutTache.InProgress;
    }
    return !task.done; // Fallback for operational tasks
  }

  // Check if administrative task is not started
  isAdministrativeTaskNotStarted(task: TaskOpportuniteDto): boolean {
    if (task.type === TYPE_ADMINISTRATIVE) {
      return this.getTaskStatut(task) === StatutTache.NotStarted;
    }
    return false; // Not applicable for operational tasks with boolean done
  }

  // Handle select dropdown change for administrative tasks
  async onAdministrativeTaskStatusChange(task: TaskOpportuniteDto, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newStatutValue = parseInt(selectElement.value);
    const newStatut = newStatutValue as StatutTache;    // Only allow managers and co-managers to change task status
    if (!this.isCurrentUserManager) {
      console.warn('Only managers and co-managers can change administrative task status');
      // Reset the select to the current value
      selectElement.value = this.getTaskStatut(task).toString();
      return;
    }

    // Only for administrative tasks
    if (task.type !== TYPE_ADMINISTRATIVE) {
      console.warn('This method is only for administrative tasks');
      return;
    }

    // Prevent multiple changes while processing
    if (this.loadingTaskIds.has(task.id)) {
      return;
    }

    // Store original status for potential rollback
    const originalStatut = this.getTaskStatut(task);

    // If the status hasn't changed, do nothing
    if (originalStatut === newStatut) {
      return;
    }

    try {
      // Set loading state
      this.loadingTaskIds.add(task.id);
        console.log('Changing administrative task status via select:', {
        taskId: task.id,
        taskName: TaskName[task.name] + ' (' + this.getTaskName(task.name) + ')',
        previousStatus: StatutTache[originalStatut],
        newStatus: StatutTache[newStatut],
        isCurrentUserManager: this.isCurrentUserManager
      });

      // Update UI immediately for better user experience
      task.statut = newStatut;
      
      // Also update done field for backward compatibility
      task.done = newStatut === StatutTache.Done;
      
      // Update the task in our local arrays immediately for real-time progress
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            statut: newStatut,
            done: newStatut === StatutTache.Done
          };
        }
      });
      
      // Also update the main tasks array immediately
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          statut: newStatut,
          done: newStatut === StatutTache.Done
        };
      }
      
      // Trigger immediate progress bar animation for real-time feedback
      this.startProgressAnimation();
      this.cdr.detectChanges();

      const updatedTaskData: TaskOpportuniteDto = {
        ...task,
        statut: newStatut,
        done: newStatut === StatutTache.Done
      };

      // Update the task via the service
      const updatedTask = await firstValueFrom(this.taskService.updateTask(task.id, updatedTaskData));
      
      if (updatedTask) {
        // Backend update successful - no need to update arrays again since we already did it above
        // Just ensure UI consistency
        this.cdr.detectChanges();
        
        console.log('Administrative task status updated successfully via select:', {
          taskId: task.id,
          newStatus: StatutTache[newStatut]
        });
      }
    } catch (error) {
      console.error('Error changing administrative task status via select:', error);
      
      // Revert the UI change if the backend update failed
      task.statut = originalStatut;
      task.done = originalStatut === StatutTache.Done;
      
      // Reset the select value to the original status
      selectElement.value = originalStatut.toString();
      
      // Revert the changes in all arrays
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            statut: originalStatut,
            done: originalStatut === StatutTache.Done
          };
        }
      });
      
      // Also revert the main tasks array
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          statut: originalStatut,
          done: originalStatut === StatutTache.Done
        };
      }
        
      // Restart progress animation to reflect the reverted state
      this.startProgressAnimation();
      this.cdr.detectChanges();
      
      // You could also show a user-friendly error message here
      alert('Erreur lors de la mise à jour du statut de la tâche. Veuillez réessayer.');
    } finally {
      // Remove loading state
      this.loadingTaskIds.delete(task.id);
      this.cdr.detectChanges();
    }
  }

  // Toggle administrative task status through the statut cycle: NotStarted -> InProgress -> Done -> NotStarted
  async toggleAdministrativeTaskStatus(task: TaskOpportuniteDto) {    // Only allow managers and co-managers to toggle task status
    if (!this.isCurrentUserManager) {
      console.warn('Only managers and co-managers can change administrative task status');
      return;
    }

    // Only for administrative tasks
    if (task.type !== TYPE_ADMINISTRATIVE) {
      console.warn('This method is only for administrative tasks');
      return;
    }

    // Prevent multiple clicks while processing
    if (this.loadingTaskIds.has(task.id)) {
      return;
    }

    // Get current status and calculate next status
    const currentStatut = this.getTaskStatut(task);
    let newStatut: StatutTache;

    switch (currentStatut) {
      case StatutTache.NotStarted:
        newStatut = StatutTache.InProgress;
        break;
      case StatutTache.InProgress:
        newStatut = StatutTache.Done;
        break;
      case StatutTache.Done:
        newStatut = StatutTache.NotStarted;
        break;
      default:
        newStatut = StatutTache.InProgress;
    }

    // Store original status for potential rollback
    const originalStatut = currentStatut;

    try {
      // Set loading state
      this.loadingTaskIds.add(task.id);
        console.log('Toggling administrative task status:', {
        taskId: task.id,
        taskName: TaskName[task.name] + ' (' + this.getTaskName(task.name) + ')',
        previousStatus: StatutTache[originalStatut],
        newStatus: StatutTache[newStatut],
        isCurrentUserManager: this.isCurrentUserManager
      });

      // Update UI immediately for better user experience
      task.statut = newStatut;
      
      // Also update done field for backward compatibility
      task.done = newStatut === StatutTache.Done;
      
      // Update the task in our local arrays immediately for real-time progress
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            statut: newStatut,
            done: newStatut === StatutTache.Done
          };
        }
      });
      
      // Also update the main tasks array immediately
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          statut: newStatut,
          done: newStatut === StatutTache.Done
        };
      }
      
      // Trigger immediate progress bar animation for real-time feedback
      this.startProgressAnimation();
      this.cdr.detectChanges();

      const updatedTaskData: TaskOpportuniteDto = {
        ...task,
        statut: newStatut,
        done: newStatut === StatutTache.Done
      };

      // Update the task via the service
      const updatedTask = await firstValueFrom(this.taskService.updateTask(task.id, updatedTaskData));
      
      if (updatedTask) {
        // Backend update successful - no need to update arrays again since we already did it above
        // Just ensure UI consistency
        this.cdr.detectChanges();
        
        console.log('Administrative task status updated successfully:', {
          taskId: task.id,
          newStatus: StatutTache[newStatut]
        });
      }
    } catch (error) {
      console.error('Error toggling administrative task status:', error);
      
      // Revert the UI change if the backend update failed
      task.statut = originalStatut;
      task.done = originalStatut === StatutTache.Done;
      
      // Revert the changes in all arrays
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            statut: originalStatut,
            done: originalStatut === StatutTache.Done
          };
        }
      });
      
      // Also revert the main tasks array
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          statut: originalStatut,
          done: originalStatut === StatutTache.Done
        };
      }
        
      // Restart progress animation to reflect the reverted state
      this.startProgressAnimation();
      this.cdr.detectChanges();
      
      // You could also show a user-friendly error message here
      alert('Erreur lors de la mise à jour du statut de la tâche. Veuillez réessayer.');
    } finally {
      // Remove loading state
      this.loadingTaskIds.delete(task.id);
      this.cdr.detectChanges();
    }
  }

  // Get button text for administrative task based on current status
  getAdministrativeTaskButtonText(task: TaskOpportuniteDto): string {
    const currentStatut = this.getTaskStatut(task);
    
    switch (currentStatut) {
      case StatutTache.NotStarted:
        return 'Commencer';
      case StatutTache.InProgress:
        return 'Terminer';
      case StatutTache.Done:
        return 'Recommencer';
      default:
        return 'Commencer';
    }
  }

  // Get button icon for administrative task based on current status
  getAdministrativeTaskButtonIcon(task: TaskOpportuniteDto): string {
    const currentStatut = this.getTaskStatut(task);
    
    switch (currentStatut) {
      case StatutTache.NotStarted:
        return 'fas fa-play';
      case StatutTache.InProgress:
        return 'fas fa-check';
      case StatutTache.Done:
        return 'fas fa-redo';
      default:
        return 'fas fa-play';
    }
  }

  // Get status dot class for administrative task
  getAdministrativeTaskStatusClass(task: TaskOpportuniteDto): string {
    const currentStatut = this.getTaskStatut(task);
    
    switch (currentStatut) {
      case StatutTache.NotStarted:
        return 'not-started';
      case StatutTache.InProgress:
        return 'in-progress';
      case StatutTache.Done:
        return 'done';
      default:
        return 'not-started';
    }
  }
  // Manual task creation methods
  async showCreateAdminTaskForm(): Promise<void> {
    if (!this.opportunityId || !this.currentOpportunity) {
      return;
    }

    const dialogRef = this.dialog.open(TaskCreationDialogComponent, {
      data: {
        opportuniteId: this.opportunityId,
        taskType: TaskType.Administrative,
        nature: this.currentOpportunity.nature
      },
      width: '500px'
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      // Reload tasks after successful creation
      this.loadTasks(this.opportunityId);
    }
  }

  async showCreateOperationalTaskForm(): Promise<void> {
    if (!this.opportunityId || !this.currentOpportunity) {
      return;
    }

    const dialogRef = this.dialog.open(TaskCreationDialogComponent, {
      data: {
        opportuniteId: this.opportunityId,
        taskType: TaskType.Operational,
        nature: this.currentOpportunity.nature
      },
      width: '500px'
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      // Reload tasks after successful creation
      this.loadTasks(this.opportunityId);
    }
  }
  // Helper method to get task display name (handles both regular and manual tasks)
  getTaskDisplayName(task: TaskOpportuniteDto): string {
    return task.newName || this.getTaskName(task.name);
  }

  // Check if a task is manually created (has newName but no predefined name)
  isManuallyCreatedTask(task: TaskOpportuniteDto): boolean {
    return !!task.newName && !task.name;
  }

  // Delete a manually created task
  async deleteManualTask(task: TaskOpportuniteDto): Promise<void> {
    if (!this.isCurrentUserManager || !this.isManuallyCreatedTask(task)) {
      console.warn('Only managers and co-managers can delete manually created tasks');
      return;
    }

    // Confirm deletion
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${this.getTaskDisplayName(task)}" ?`);
    if (!confirmDelete) {
      return;
    }

    // Prevent multiple clicks while processing
    if (this.loadingTaskIds.has(task.id)) {
      return;
    }

    try {
      // Set loading state
      this.loadingTaskIds.add(task.id);
      
      console.log('Deleting manual task:', {
        taskId: task.id,
        taskName: this.getTaskDisplayName(task),
        isManual: this.isManuallyCreatedTask(task)
      });

      // Delete the task via the service
      await firstValueFrom(this.taskService.deleteTask(task.id));
      
      console.log('Task deleted successfully:', task.id);
      
      // Reload tasks to refresh the view
      if (this.opportunityId) {
        this.loadTasks(this.opportunityId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Erreur lors de la suppression de la tâche. Veuillez réessayer.');    } finally {
      // Remove loading state
      this.loadingTaskIds.delete(task.id);
      this.cdr.detectChanges();
    }
  }
  /**
   * Convert TypePartenaire enum value to human-readable text
   */
  getPartenaireTypeLabel(type: TypePartenaire | number | null | undefined): string {
    if (type === null || type === undefined) {
      return 'Non défini';
    }
    
    switch (Number(type)) {
      case TypePartenaire.ExpertIndividuel:
        return 'Expert individuel';
      case TypePartenaire.Entreprise:
        return 'Entreprise';
      default:
        return 'Type inconnu';
    }
  }
  /**
   * Copy Teams link to clipboard
   */
  copyTeamsLink(): void {
    if (this.currentOpportunity?.linkTeams1) {
      const teamsLink = this.currentOpportunity.linkTeams1;
      navigator.clipboard.writeText(teamsLink)
        .then(() => {
          // Show success feedback (you could add a toast notification here)
          console.log('Teams link copied to clipboard');
          
          // Temporarily change the button text or icon to show success
          const copyButton = document.querySelector('.copy-button i') as HTMLElement;
          if (copyButton) {
            const originalClass = copyButton.className;
            copyButton.className = 'fas fa-check';
            setTimeout(() => {
              copyButton.className = originalClass;
            }, 1500);
          }
        })
        .catch(err => {
          console.error('Failed to copy Teams link: ', err);
          // Fallback for older browsers
          this.fallbackCopyToClipboard(teamsLink);
        });
    }
  }
  /**
   * Fallback copy method for browsers that don't support navigator.clipboard
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      console.log('Teams link copied to clipboard (fallback)');
    } catch (err) {
      console.error('Fallback: Unable to copy Teams link', err);
    }
    
    document.body.removeChild(textArea);
  }
  
  /**
   * Open Teams link in a new tab
   */
  openTeamsLink(): void {
    if (this.currentOpportunity?.linkTeams1) {
      const teamsLink = this.currentOpportunity.linkTeams1;
      window.open(teamsLink, '_blank', 'noopener,noreferrer');
    }
  }
  
  /**
   * Check if the current user can validate the opportunity
   */
  canValidateOpportunity(): boolean {
    // Only managers and co-managers can validate AND the opportunity must be either null or "Not" status
    return this.isCurrentUserManager && (
      this.currentOpportunity?.status === null || 
      this.currentOpportunity?.status === undefined || 
      this.currentOpportunity?.status === Status.Not
    );
  }

  /**
   * Open the validation dialog
   */
  openValidationDialog(): void {
    if (!this.opportunityId || !this.canValidateOpportunity()) {
      return;
    }

    const dialogData: ValidationDialogData = {
      opportunityId: this.opportunityId,
      associeEnCharge: this.associeEnCharge,
      managerEnCharge: this.managerEnCharge,
      coManagerEnCharge: this.coManagerEnCharge,
      seniorManagerEnCharge: this.seniorManagerEnCharge,
      equipeProjet: this.equipeProjet
    };    const dialogRef = this.dialog.open(ValidationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        console.log('Validation submitted successfully:', result);
        // Optionally refresh the opportunity data or show a success message
        if (this.opportunityId) {
          this.loadOpportunityData(this.opportunityId);
        }
      }
    });
  }
  /**
   * Check if status should be displayed (only show when status is not null/undefined)
   */
  shouldShowStatus(): boolean {
    const status = this.currentOpportunity?.status;
    return status !== null && status !== undefined;
  }

  /**
   * Get the status label text for display
   */
  getStatusLabel(): string {
    const status = this.currentOpportunity?.status;
    
    if (status === null || status === undefined) {
      return '';  // Return empty string since this should not be displayed
    }
    
    switch (status) {
      case Status.Approved:
        return 'Approuvé';
      case Status.Not:
        return 'Non approuvé';
      case Status.Pending:
        return 'En attente';
      default:
        return 'Statut inconnu';
    }
  }
  /**
   * Get the CSS class for status styling
   */
  getStatusClass(): string {
    const status = this.currentOpportunity?.status;
    
    if (status === null || status === undefined) {
      return '';  // Return empty string since this should not be displayed
    }
    
    switch (status) {
      case Status.Approved:
        return 'status-approved';
      case Status.Not:
        return 'status-not';
      case Status.Pending:
        return 'status-pending';
      default:
        return 'status-unknown';
    }
  }

  // ===== EQUIPE DICTIONARY HELPER METHODS =====

  // Get array of assigned member IDs from the equipe dictionary
  getAssignedMemberIds(task: TaskOpportuniteDto): string[] {
    if (!task.equipe || typeof task.equipe !== 'object') {
      return [];
    }
    return Object.keys(task.equipe);
  }

  // Check if a specific user is assigned to a task
  isUserAssignedToTask(task: TaskOpportuniteDto, userId: string): boolean {
    return task.equipe && typeof task.equipe === 'object' && userId in task.equipe;
  }

  // Get the completion status of a specific user for a task
  getUserTaskCompletionStatus(task: TaskOpportuniteDto, userId: string): boolean {
    if (!task.equipe || typeof task.equipe !== 'object') {
      return false;
    }
    return task.equipe[userId] || false;
  }

  // Check if all assigned members have completed the task
  areAllMembersCompleted(task: TaskOpportuniteDto): boolean {
    if (!task.equipe || typeof task.equipe !== 'object') {
      return false;
    }
    const memberIds = Object.keys(task.equipe);
    if (memberIds.length === 0) {
      return false;
    }
    return memberIds.every(memberId => task.equipe[memberId] === true);
  }

  // Toggle individual member completion status for a task
  async toggleIndividualMemberTaskCompletion(task: TaskOpportuniteDto, userId: string): Promise<void> {
    if (!this.isUserAssignedToTask(task, userId)) {
      console.warn('User is not assigned to this task');
      return;
    }

    // Prevent multiple clicks while processing
    if (this.loadingTaskIds.has(task.id)) {
      return;
    }

    const currentStatus = this.getUserTaskCompletionStatus(task, userId);
    const newStatus = !currentStatus;

    try {
      // Set loading state
      this.loadingTaskIds.add(task.id);

      console.log('Toggling individual member task completion:', {
        taskId: task.id,
        userId: userId,
        currentStatus: currentStatus,
        newStatus: newStatus
      });

      // Update local state immediately for better UX
      const updatedEquipe = { ...task.equipe };
      updatedEquipe[userId] = newStatus;

      // Calculate if all members are now completed (AND relation)
      const allCompleted = Object.values(updatedEquipe).every(status => status === true);

      // Update the task object
      task.equipe = updatedEquipe;
      task.done = allCompleted;

      // Update the task in our local arrays immediately
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            equipe: updatedEquipe,
            done: allCompleted
          };
        }
      });

      // Also update the main tasks array
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          equipe: updatedEquipe,
          done: allCompleted
        };
      }

      // Trigger progress bar animation
      this.startProgressAnimation();
      this.cdr.detectChanges();

      // Prepare the update data for backend
      const updatedTaskData: TaskOpportuniteDto = {
        ...task,
        equipe: updatedEquipe,
        done: allCompleted
      };

      // Update the task via the service
      const updatedTask = await firstValueFrom(this.taskService.updateTask(task.id, updatedTaskData));
      
      if (updatedTask) {
        console.log('Individual member task completion updated successfully:', {
          taskId: task.id,
          userId: userId,
          newStatus: newStatus,
          allCompleted: allCompleted
        });
      }
    } catch (error) {
      console.error('Error updating individual member task completion:', error);
      
      // Revert the UI changes if the backend update failed
      const originalEquipe = { ...task.equipe };
      originalEquipe[userId] = currentStatus;
      const originalDoneStatus = Object.values(originalEquipe).every(status => status === true);
      
      task.equipe = originalEquipe;
      task.done = originalDoneStatus;
      
      // Revert changes in all arrays
      [this.administrativeTasks, this.operationalTasksAMI, this.operationalTasksPropale, this.currentUserTasks].forEach(list => {
        const index = list.findIndex(t => t.id === task.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            equipe: originalEquipe,
            done: originalDoneStatus
          };
        }
      });

      // Revert main tasks array
      const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (mainTaskIndex !== -1) {
        this.tasks[mainTaskIndex] = {
          ...this.tasks[mainTaskIndex],
          equipe: originalEquipe,
          done: originalDoneStatus
        };
      }

      // Restart progress animation
      this.startProgressAnimation();
      this.cdr.detectChanges();
      
      alert('Erreur lors de la mise à jour du statut de votre tâche. Veuillez réessayer.');
    } finally {
      // Remove loading state
      this.loadingTaskIds.delete(task.id);
      this.cdr.detectChanges();
    }
  }

  // Check if current user can toggle their own task completion
  canCurrentUserToggleTaskCompletion(task: TaskOpportuniteDto): boolean {
    return this.currentUserId ? this.isUserAssignedToTask(task, this.currentUserId) : false;
  }

  // ===== END EQUIPE DICTIONARY HELPER METHODS =====

  // Helper method to convert array of member IDs to dictionary with all false values
  private convertMemberArrayToDictionary(memberIds: string[]): { [key: string]: boolean } {
    const dictionary: { [key: string]: boolean } = {};
    memberIds.forEach(id => {
      dictionary[id] = false; // Default all members to not completed
    });
    return dictionary;
  }

  // Helper method to convert dictionary back to array of member IDs for backwards compatibility
  private convertDictionaryToMemberArray(equipe: { [key: string]: boolean } | string[]): string[] {
    if (Array.isArray(equipe)) {
      return equipe; // Already an array, return as is
    }
    if (typeof equipe === 'object' && equipe !== null) {
      return Object.keys(equipe);
    }
    return []; // Return empty array if equipe is null or undefined
  }

  // ===== DECISION FUNCTIONALITY =====

  // Check if the decision tab should be visible
  shouldShowDecisionTab(): boolean {
    return this.currentOpportunity?.status !== null && this.currentOpportunity?.status !== undefined;
  }

  // Check if current user is the partner in charge (associé en charge)
  isCurrentUserPartnerInCharge(): boolean {
    return this.currentUserId === this.currentOpportunity?.associeEnCharge;
  }

  // Check if current user can edit the decision (only partner in charge)
  canEditDecision(): boolean {
    return this.isCurrentUserPartnerInCharge();
  }

  // Check if current user can view the decision (all team members when status is approved/rejected)
  canViewDecision(): boolean {
    if (!this.currentOpportunity || this.currentOpportunity.status === null || this.currentOpportunity.status === undefined) {
      return false;
    }
    
    // Status: 0 = Approved, 1 = Rejected, 2 = Pending
    const isDecisionMade = this.currentOpportunity.status === Status.Approved || this.currentOpportunity.status === Status.Not;
    
    if (!isDecisionMade) {
      return false;
    }

    // All team members can view when decision is made
    return this.isCurrentUserPartnerInCharge() || 
           this.currentUserId === this.currentOpportunity?.managerEnCharge ||
           this.currentUserId === this.currentOpportunity?.seniorManagerEnCharge ||
           (this.currentOpportunity?.equipeProjet && this.currentUserId ? this.currentOpportunity.equipeProjet.includes(this.currentUserId) : false);
  }

  // Get status label for display
  getDecisionStatusLabel(): string {
    if (!this.currentOpportunity || this.currentOpportunity.status === null || this.currentOpportunity.status === undefined) {
      return 'En attente';
    }

    switch (this.currentOpportunity.status) {
      case Status.Approved:
        return 'Approuvée';
      case Status.Not:
        return 'Rejetée';
      case Status.Pending:
        return 'En attente de décision';
      default:
        return 'Statut inconnu';
    }
  }

  // Get status class for styling
  getDecisionStatusClass(): string {
    if (!this.currentOpportunity || this.currentOpportunity.status === null || this.currentOpportunity.status === undefined) {
      return 'status-pending';
    }

    switch (this.currentOpportunity.status) {
      case Status.Approved:
        return 'status-approved';
      case Status.Not:
        return 'status-rejected';
      case Status.Pending:
        return 'status-pending';
      default:
        return 'status-unknown';
    }
  }

  // Approve the opportunity
  async approveOpportunity(): Promise<void> {
    if (!this.currentOpportunity || !this.canEditDecision()) {
      return;
    }

    this.isDecisionLoading = true;

    try {
      const updatedOpportunity = {
        ...this.currentOpportunity,
        status: Status.Approved,
        commentaire: this.decisionComment.trim() || undefined
      };

      const result = await firstValueFrom(
        this.opportuniteService.updateOpportunite(this.currentOpportunity.id, updatedOpportunity)
      );

      this.currentOpportunity = result;
      this.decisionComment = ''; // Clear the comment field
      console.log('Opportunity approved successfully');
      
      // Refresh the page and automatically switch to the "Décision" tab
      this.refreshAndSwitchToDecisionTab();
    } catch (error) {
      console.error('Error approving opportunity:', error);
      // You might want to show an error message to the user here
    } finally {
      this.isDecisionLoading = false;
    }
  }

  // Reject the opportunity
  async rejectOpportunity(): Promise<void> {
    if (!this.currentOpportunity || !this.canEditDecision()) {
      return;
    }

    this.isDecisionLoading = true;

    try {
      const updatedOpportunity = {
        ...this.currentOpportunity,
        status: Status.Not,
        commentaire: this.decisionComment.trim() || undefined
      };

      const result = await firstValueFrom(
        this.opportuniteService.updateOpportunite(this.currentOpportunity.id, updatedOpportunity)
      );

      this.currentOpportunity = result;
      this.decisionComment = ''; // Clear the comment field
      console.log('Opportunity rejected successfully');
      
      // Refresh the page and automatically switch to the "Décision" tab
      this.refreshAndSwitchToDecisionTab();
    } catch (error) {
      console.error('Error rejecting opportunity:', error);
      // You might want to show an error message to the user here
    } finally {
      this.isDecisionLoading = false;
    }
  }

  // Refresh the page and automatically switch to the "Décision" tab
  private refreshAndSwitchToDecisionTab(): void {
    // Navigate to the same route with fragment to force refresh and auto-select decision tab
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/layout/opportunity-tracking', this.opportunityId], {
        fragment: 'decision'
      }).then(() => {
        // Set the active view to decision after navigation
        setTimeout(() => {
          this.activeView = 'decision';
          this.cdr.detectChanges();
        }, 100);
      });
    });
  }
}
