// Profile interface matching the backend entity

export enum TypeDepense {
  AllocationPerDiem = 0,
  VoyageInternationaux = 1,
  FraisVisaTimbreVoyage = 2,
  TransfertLocationsVoitures = 3,
  Logement = 4
} 


export interface ProfilDto {
  id: string;
  nomPrenom?: string;
  numero?: number;
  poste?: string;
  tjm?: number;
  totalParProfil?: number;
  totalCostParProfil?: number;
  totalSiege?: number;
  totalTerrain?: number;
  totalSiegeParJour?: number;
  totalTerrainParJour?: number;
  idPartenaire?: string;
  idPropositionFinanciere?: string;
  unitsDepense?: Record<TypeDepense, number>;
  totalDepense?: number;
}