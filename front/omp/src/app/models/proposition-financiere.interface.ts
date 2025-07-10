// Interface matching the backend PropositionFinanciere entity

// TypeDepense enum to match backend TypeDepense enum
export enum TypeDepense {
  AllocationPerDiem = 0,
  VoyageInternationaux = 1,
  FraisVisaTimbreVoyage = 2,
  TransfertLocationsVoitures = 3,
  Logement = 4
}

export interface PropositionFinanciereDto {
  id: string;
  nom?: string;
  dateCreation?: Date;
  dateModification?: Date;
  createdBy?: string;
  nbrSemaines?: number;
  matricePL?: number[][];
  matricePLSiege?: number[][];
  matricePLTerrain?: number[][];
  matricePLSiegeParJour?: number[][];
  matricePLTerrainParJour?: number[][];
  totalCost?: number;
  averageTJM?: number;
  sumHJ?: number;
  budgetPartEY?: number;
  budgetsPartenaires?: Record<string, number>;
  nbrHJPartEY?: number;
  nbrHJPartenaires?: Record<string, number>;
  pourcentHjEY?: number;
  pourcentHjPartenaires?: Record<string, number>;
  pourcentBudgetEY?: number;
  pourcentBudgetPartenaires?: Record<string, number>;
  totalExpenses?: number;
  totalProjet?: number;
  nbrJoursParMois?: number;
  profils?: string[];
  livrables?: string[];
  prixDepenses?: Record<TypeDepense, number>; // Added to match backend Dictionary<TypeDepense, int>
}