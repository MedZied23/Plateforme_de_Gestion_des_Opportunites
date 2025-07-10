// Interface for the Reference model matching the backend swagger documentation
export interface ReferenceDto {
  id: string;
  nom: string;
  country: string;
  offre: string;
  client: string;
  budget: number;
  dateDebut: Date;
  dateFin: Date;
  equipe: { [key: string]: string }; // Changed from string[] to dictionary
  description: string;
  services: {
    [key: string]: {
      [key: string]: string[];
    };
  };
  documentUrl?: string;
  lastModified: Date;
  lastAccessed: Date;
}
