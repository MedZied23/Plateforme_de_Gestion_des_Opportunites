import { Injectable } from '@angular/core';
import { TaskName } from '../enums/task-name.enum';

@Injectable({
  providedIn: 'root'
})
export class TaskNameService {
  private readonly frenchTaskNames: Record<TaskName, string> = {
    [TaskName.CreationSurCRM]: 'Création sur CRM',
    [TaskName.PACE]: 'PACE',
    [TaskName.BRIDGE]: 'BRIDGE',
    [TaskName.RevueDeTaxe]: 'Revue de Taxe',
    [TaskName.WhyEY]: 'Why EY',
    [TaskName.Contexte]: 'Contexte',
    [TaskName.Cvs]: 'CVs',
    [TaskName.References]: 'Références',
    [TaskName.CommentairesAuxTDR]: 'Commentaires aux TDR',
    [TaskName.Methodologie]: 'Méthodologie',
    [TaskName.Planning]: 'Planning'
  };

  /**
   * Get the French display name for a task
   * @param taskName The TaskName enum value
   * @returns The French name for the task
   */
  getFrenchTaskName(taskName: TaskName): string {
    return this.frenchTaskNames[taskName] || TaskName[taskName];
  }

  /**
   * Get the English enum name for a task
   * @param taskName The TaskName enum value
   * @returns The English enum name for the task
   */
  getEnumTaskName(taskName: TaskName): string {
    return TaskName[taskName];
  }

  /**
   * Get a debug-friendly name that includes both English and French
   * @param taskName The TaskName enum value
   * @returns A string containing both English and French names
   */
  getDebugTaskName(taskName: TaskName): string {
    return `${TaskName[taskName]} (${this.frenchTaskNames[taskName]})`;
  }
}
