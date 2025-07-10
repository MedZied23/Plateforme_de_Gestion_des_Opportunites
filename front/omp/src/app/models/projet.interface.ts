export interface ProjetDto {
  id: string;  // Using string for Guid representation
  cvId?: string;  // Foreign key to CV (optional)
  nom?: string;
  year?: number;
  client?: string;
  domaine?: string;
  perimetre?: {[key: string]: string[]};  // Dictionary representation in TypeScript
  role?: string;
  hide?: boolean;
}