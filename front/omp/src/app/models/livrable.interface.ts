export interface LivrableDto {
  id: string;  // Using string for Guid representation
  nom?: string;
  numero?: number;
  startWeek?: number;  // In weeks
  endWeek?: number;  // In weeks
  duration?: number;  // In weeks
  totalParLivrable?: number;  // In person-days
  pourcentage?: number;
  idPhase?: string;  // Using string for Guid representation
}