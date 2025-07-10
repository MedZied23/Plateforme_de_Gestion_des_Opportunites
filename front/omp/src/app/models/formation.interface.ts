export interface FormationDto {
  id: string;  // Using string for Guid representation
  cvId?: string;  // Foreign key to CV (optional)
  diplome?: string;
  institution?: string;
  dateDebut?: Date;
  dateFin?: Date;
}