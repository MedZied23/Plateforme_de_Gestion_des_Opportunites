import { NiveauLangue } from './niveau-langue.enum';

export interface CvDto {
  id: string;  // Using string for Guid representation
  id_user?: string;  // Using string for Guid representation
  presentation?: string;
  formations?: string[];  // Array of strings for Guid representation
  languesPratiquees?: {[langue: string]: NiveauLangue};  // Dictionary representation in TypeScript
  experiences?: string[];  // Array of strings for Guid representation
  certifications?: string[];
  projets?: string[];  // Array of strings for Guid representation
  documentUrl?: string;  // URL to the uploaded CV document
  matchedProjectIds?: string[];  // Array of matched project IDs from search results
}