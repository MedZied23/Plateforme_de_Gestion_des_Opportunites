export interface ExperienceDto {
  id: string;  // Using string for Guid representation
  cvId?: string;  // Foreign key to CV (optional)
  employer?: string;
  poste?: string;
  dateDebut?: Date;
  dateFin?: Date;
}