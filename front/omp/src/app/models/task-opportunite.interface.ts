import { TaskName } from '../enums/task-name.enum';
import { TaskType } from '../enums/task-type.enum';
import { StatutTache } from '../enums/statut-tache.enum';

export interface TaskOpportuniteDto {
  id: string;
  opportuniteId: string;
  name: TaskName;
  newName?: string; // For manual tasks - displayed instead of 'name'
  type: TaskType;
  equipe: { [key: string]: boolean }; // Dictionary where key is user ID and value is completion status
  dateAssigned: Date;
  dateDone?: Date;
  percentage: number;
  numero: number;
  done: boolean; // Keep for backward compatibility with operational tasks
  statut?: StatutTache; // New status field for administrative tasks
  nature: number;
}
