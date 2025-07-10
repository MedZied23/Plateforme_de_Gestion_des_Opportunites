using System;
using System.Collections.Generic;
using System.Linq;
using omp.Domain.Entites;


namespace omp.Domain.Services
{

    public class CalculationsService
    {

        //-----------------------------//
        // PROFIL RELATED CALCULATIONS //
        //-----------------------------//

        public decimal? CalculateAverageTJM(IEnumerable<Profil> profiles)
        {
            if (profiles == null || !profiles.Any())
            {
                return null;
            }

            var tjmValues = profiles
                .Where(p => p.TJM.HasValue)
                .Select(p => (decimal)p.TJM.Value);

            if (!tjmValues.Any())
            {
                return null;
            }

            return tjmValues.Average();
        }

        //-----------------------------//
        // PROPOSITION FINANCIERE RELATED CALCULATIONS //
        //-----------------------------//

        public int CalculateSumHJ(List<List<int>>? matricePL)
        {
            if (matricePL == null || !matricePL.Any())
            {
                return 0;
            }

            return matricePL.Sum(row => row.Sum());
        }

        public List<List<decimal>>? CalculateMatricePLSiegeParJour(List<List<int>>? matricePLSiege, decimal? nbrJoursParMois)
        {
            // Return null if the matrix is null/empty or if nbrJoursParMois is null or zero
            if (matricePLSiege == null || !matricePLSiege.Any() || nbrJoursParMois == null || nbrJoursParMois == 0)
            {
                return null;
            }

            // Create a new matrix for the result
            var matriceParJour = new List<List<decimal>>();
            
            // For each row in the original matrix
            foreach (var row in matricePLSiege)
            {
                // Create a new row for the result matrix
                var newRow = new List<decimal>();
                
                // For each value in the current row
                foreach (var value in row)
                {
                    // Divide the value by nbrJoursParMois and add to the new row
                    newRow.Add((decimal)value / nbrJoursParMois.Value);
                }
                
                // Add the new row to the result matrix
                matriceParJour.Add(newRow);
            }
            
            return matriceParJour;
        }

        public List<List<decimal>>? CalculateMatricePLTerrainParJour(List<List<int>>? matricePLTerrain, decimal? nbrJoursParMois)
        {
            // Return null if the matrix is null/empty or if nbrJoursParMois is null or zero
            if (matricePLTerrain == null || !matricePLTerrain.Any() || nbrJoursParMois == null || nbrJoursParMois == 0)
            {
                return null;
            }

            // Create a new matrix for the result
            var matriceParJour = new List<List<decimal>>();
            
            // For each row in the original matrix
            foreach (var row in matricePLTerrain)
            {
                // Create a new row for the result matrix
                var newRow = new List<decimal>();
                
                // For each value in the current row
                foreach (var value in row)
                {
                    // Divide the value by nbrJoursParMois and add to the new row
                    newRow.Add((decimal)value / nbrJoursParMois.Value);
                }
                
                // Add the new row to the result matrix
                matriceParJour.Add(newRow);
            }
            
            return matriceParJour;
        }

        //-----------------------------//
        // LIVRABLE RELATED CALCULATIONS //
        //-----------------------------//

        public int CalculateTotalParLivrable(List<List<int>>? matricePL, int? livrableNumeroInProposition)
        {
            // Return 0 if the matrix is null/empty or if livrableNumeroInProposition is null
            if (matricePL == null || !matricePL.Any() || livrableNumeroInProposition == null)
            {
                return 0;
            }

            // Convert from 1-based livrable number to 0-based column index
            int columnIndex = livrableNumeroInProposition.Value - 1;
            int total = 0;

            // Sum the values in the column corresponding to the livrable's NumeroInProposition
            foreach (var row in matricePL)
            {
                // Skip rows that are too short (don't have this column)
                if (columnIndex >= 0 && row.Count > columnIndex)
                {
                    total += row[columnIndex];
                }
            }

            return total;
        }

        public decimal CalculatePourcentageLivrable(List<List<int>>? matricePL, int? livrableNumeroInProposition)
        {
            // If inputs are invalid, return 0
            if (matricePL == null || !matricePL.Any() || livrableNumeroInProposition == null)
            {
                return 0;
            }

            // Calculate the total for this livrable
            int totalLivrable = CalculateTotalParLivrable(matricePL, livrableNumeroInProposition);
            
            // Calculate the sum of all HJs
            int sumHJ = CalculateSumHJ(matricePL);

            // Avoid division by zero
            if (sumHJ == 0)
            {
                return 0;
            }

            // Calculate and return the percentage (as decimal)
            return (decimal)totalLivrable / sumHJ * 100;
        }

        /// <summary>
        /// Calculates the absolute position (NumeroInProposition) of a livrable in the proposition
        /// by adding its number within its phase to the sum of livrables in all previous phases
        /// </summary>
        /// <param name="livrable">The livrable for which to calculate NumeroInProposition</param>
        /// <param name="allLivrables">All livrables in the proposition</param>
        /// <param name="allPhases">All phases in the proposition, used for ordering</param>
        /// <returns>The absolute position of the livrable in the proposition</returns>
        public int CalculateNumeroInProposition(Livrable livrable, IEnumerable<Livrable> allLivrables, IEnumerable<Phase> allPhases)
        {
            if (livrable == null || livrable.Numero == null || livrable.IdPhase == null || 
                allLivrables == null || !allLivrables.Any() ||
                allPhases == null || !allPhases.Any())
            {
                return 0;
            }

            // Get the current livrable's phase
            var livrablePhase = allPhases.FirstOrDefault(p => p.Id == livrable.IdPhase.Value);
            if (livrablePhase == null || !livrablePhase.Numero.HasValue)
            {
                return 0;
            }

            // Group livrables by phase
            var livrablesGroupedByPhase = allLivrables
                .Where(l => l.IdPhase != null && l.Numero != null)
                .GroupBy(l => l.IdPhase.Value);
            
            // Calculate the absolute position based on phase order
            int previousPhasesLivrableCount = 0;
            
            // Get all phases and their livrables
            foreach (var phaseGroup in livrablesGroupedByPhase)
            {
                Guid phaseId = phaseGroup.Key;
                
                // Skip the livrable's own phase
                if (phaseId == livrable.IdPhase.Value)
                    continue;
                    
                // Get all livrables in this phase
                var livrablesInPhase = phaseGroup.ToList();
                
                // Get the current phase from the allPhases collection
                var currentPhase = allPhases.FirstOrDefault(p => p.Id == phaseId);
                
                // Skip if the phase is not found or has no number
                if (currentPhase == null || !currentPhase.Numero.HasValue)
                    continue;
                
                // Only count livrables in phases that come before the livrable's phase (using Phase.Numero for ordering)
                if (currentPhase.Numero < livrablePhase.Numero)
                {
                    previousPhasesLivrableCount += livrablesInPhase.Count;
                }
            }

            // Return the absolute position (1-based)
            return previousPhasesLivrableCount + livrable.Numero.Value;
        }

        //-----------------------------//
        // PHASE RELATED CALCULATIONS //
        //-----------------------------//

        public int CalculateTotalParPhase(List<List<int>>? matricePL, Guid? phaseId, IEnumerable<Livrable> allLivrables, IEnumerable<Phase> allPhases)
        {
            // Return 0 if any input is invalid
            if (matricePL == null || !matricePL.Any() || phaseId == null || 
                allLivrables == null || !allLivrables.Any() || 
                allPhases == null || !allPhases.Any())
            {
                return 0;
            }

            // Get all livrables for this phase
            var livrablesInPhase = allLivrables.Where(l => l.IdPhase != null && 
                                                     l.Numero != null &&
                                                     // Check if this livrable belongs to the target phase
                                                     l.IdPhase.Value.Equals(phaseId));

            // Sum up the totals for all livrables in this phase
            int totalPhase = 0;
            
            foreach (var livrable in livrablesInPhase)
            {
                // Calculate the absolute position (numeroInProposition) for this livrable
                int numeroInProposition = CalculateNumeroInProposition(livrable, allLivrables, allPhases);
                
                // Calculate total for this livrable using CalculateTotalParLivrable with the correct position
                totalPhase += CalculateTotalParLivrable(matricePL, numeroInProposition);
            }

            return totalPhase;
        }
        
        public decimal CalculatePourcentagePhase(List<List<int>>? matricePL, Guid? phaseId, IEnumerable<Livrable> allLivrables, IEnumerable<Phase> allPhases)
        {
            // If inputs are invalid, return 0
            if (matricePL == null || !matricePL.Any() || phaseId == null || 
                allLivrables == null || !allLivrables.Any() ||
                allPhases == null || !allPhases.Any())
            {
                return 0;
            }

            // Calculate the total for this phase using the more accurate method
            int totalPhase = CalculateTotalParPhase(matricePL, phaseId, allLivrables, allPhases);
            
            // Calculate the sum of all HJs
            int sumHJ = CalculateSumHJ(matricePL);

            // Avoid division by zero
            if (sumHJ == 0)
            {
                return 0;
            }

            // Calculate and return the percentage (as decimal)
            return (decimal)totalPhase / sumHJ * 100;
        }

        //-----------------------------//
        // PROFIL RELATED CALCULATIONS //
        //-----------------------------//

        public int CalculateTotalParProfil(List<List<int>>? matricePL, int? profilNumero)
        {
            // Return 0 if the matrix is null/empty or if profilNumero is null
            if (matricePL == null || !matricePL.Any() || profilNumero == null)
            {
                return 0;
            }

            // Convert from 1-based profile number to 0-based row index
            int rowIndex = profilNumero.Value - 1;
            
            // Return 0 if the rowIndex is out of bounds
            if (rowIndex < 0 || rowIndex >= matricePL.Count)
            {
                return 0;
            }

            // Sum all the values in the row corresponding to the profile's numero
            return matricePL[rowIndex].Sum();
        }

        public int? TotalCostParProfil(List<List<int>>? matricePL, Profil profil)
        {
            // Return null if the matrix is null/empty or if profil is null
            if (matricePL == null || !matricePL.Any() || profil == null)
            {
                return null;
            }

            // Return null if profil.Numero or profil.TJM is null
            if (!profil.Numero.HasValue || !profil.TJM.HasValue)
            {
                return null;
            }

            // Calculate the total HJ for this profile
            int totalHJ = CalculateTotalParProfil(matricePL, profil.Numero);
            
            // Calculate the total cost by multiplying totalHJ by the TJM and converting to int
            return (int)(totalHJ * profil.TJM.Value);
        }

        public int CalculateTotalSiege(List<List<int>>? matricePLsiege, int? profilNumero)
        {
            // Return 0 if the matrix is null/empty or if profilNumero is null
            if (matricePLsiege == null || !matricePLsiege.Any() || profilNumero == null)
            {
                return 0;
            }

            // Convert from 1-based profile number to 0-based row index
            int rowIndex = profilNumero.Value - 1;
            
            // Return 0 if the rowIndex is out of bounds
            if (rowIndex < 0 || rowIndex >= matricePLsiege.Count)
            {
                return 0;
            }

            // Sum all the values in the row corresponding to the profile's numero
            return matricePLsiege[rowIndex].Sum();
        }

        public int CalculateTotalTerrain(List<List<int>>? matricePLterrain, int? profilNumero)
        {
            // Return 0 if the matrix is null/empty or if profilNumero is null
            if (matricePLterrain == null || !matricePLterrain.Any() || profilNumero == null)
            {
                return 0;
            }

            // Convert from 1-based profile number to 0-based row index
            int rowIndex = profilNumero.Value - 1;
            
            // Return 0 if the rowIndex is out of bounds
            if (rowIndex < 0 || rowIndex >= matricePLterrain.Count)
            {
                return 0;
            }

            // Sum all the values in the row corresponding to the profile's numero
            return matricePLterrain[rowIndex].Sum();
        }

        public decimal? CalculateTotalSiegeParJour(int totalSiege, decimal? nbrJoursParMois)
        {
            // Return null if nbrJoursParMois is null or zero to avoid division by zero
            if (nbrJoursParMois == null || nbrJoursParMois == 0)
            {
                return null;
            }

            // Divide the total siege value by the number of days per month
            return (decimal)totalSiege / nbrJoursParMois.Value;
        }

        public decimal? CalculateTotalTerrainParJour(int totalTerrain, decimal? nbrJoursParMois)
        {
            // Return null if nbrJoursParMois is null or zero to avoid division by zero
            if (nbrJoursParMois == null || nbrJoursParMois == 0)
            {
                return null;
            }

            // Divide the total terrain value by the number of days per month
            return (decimal)totalTerrain / nbrJoursParMois.Value;
        }

        //-----------------------------//
        // PROPOSITION FINANCIERE RELATED CALCULATIONS //
        //-----------------------------//

        public int? CalculateTotalCost(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            // Return null if the matrix is null/empty or if profiles is null
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return null;
            }

            int totalCost = 0;
            
            // Sum the TotalCostParProfil for each profile
            foreach (var profil in profiles)
            {
                var profilCost = TotalCostParProfil(matricePL, profil);
                
                // Only add the cost if it's not null
                if (profilCost.HasValue)
                {
                    totalCost += profilCost.Value;
                }
            }

            return totalCost;
        }

        public int? CalculateBudgetPartEY(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            // Return null if the matrix is null/empty or if profiles is null
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return null;
            }

            int totalEYCost = 0;
            
            // Sum the TotalCostParProfil for each EY profile (profiles with null IdPartenaire)
            foreach (var profil in profiles.Where(p => p.IdPartenaire == null))
            {
                var profilCost = TotalCostParProfil(matricePL, profil);
                
                // Only add the cost if it's not null
                if (profilCost.HasValue)
                {
                    totalEYCost += profilCost.Value;
                }
            }

            return totalEYCost;
        }

        public int CalculateNbHJpartEY(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            // Return 0 if the matrix is null/empty or if profiles is null
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return 0;
            }

            int totalHJ = 0;
            
            // Sum the TotalParProfil for each EY profile (profiles with null IdPartenaire)
            foreach (var profil in profiles.Where(p => p.IdPartenaire == null))
            {
                // Skip if profile.Numero is null
                if (!profil.Numero.HasValue)
                {
                    continue;
                }
                
                // Calculate and add the total HJ for this profile
                int profilHJ = CalculateTotalParProfil(matricePL, profil.Numero);
                totalHJ += profilHJ;
            }

            return totalHJ;
        }

        public Dictionary<Guid, int> CalculateBudgetsPartenaires(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            var budgetParPartenaire = new Dictionary<Guid, int>();
            
            // Return empty dictionary if inputs are invalid
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return budgetParPartenaire;
            }
            
            // Group profiles by partner ID, filtering out those with null partner ID (EY profiles)
            var profilsParPartenaire = profiles
                .Where(p => p.IdPartenaire.HasValue)
                .GroupBy(p => p.IdPartenaire.Value);
                
            // For each partner, calculate the sum of all profile costs
            foreach (var partenaireGroup in profilsParPartenaire)
            {
                Guid partenaireId = partenaireGroup.Key;
                int totalBudget = 0;
                
                foreach (var profil in partenaireGroup)
                {
                    var profilCost = TotalCostParProfil(matricePL, profil);
                    
                    // Only add the cost if it's not null
                    if (profilCost.HasValue)
                    {
                        totalBudget += profilCost.Value;
                    }
                }
                
                budgetParPartenaire[partenaireId] = totalBudget;
            }
            
            return budgetParPartenaire;
        }

        public Dictionary<Guid, int> CalculateNbHJPartenaires(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            var hjParPartenaire = new Dictionary<Guid, int>();
            
            // Return empty dictionary if inputs are invalid
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return hjParPartenaire;
            }
            
            // Group profiles by partner ID, filtering out those with null partner ID (EY profiles)
            var profilsParPartenaire = profiles
                .Where(p => p.IdPartenaire.HasValue)
                .GroupBy(p => p.IdPartenaire.Value);
                
            // For each partner, calculate the sum of all profile HJs
            foreach (var partenaireGroup in profilsParPartenaire)
            {
                Guid partenaireId = partenaireGroup.Key;
                int totalHJ = 0;
                
                foreach (var profil in partenaireGroup)
                {
                    // Skip if profile.Numero is null
                    if (!profil.Numero.HasValue)
                    {
                        continue;
                    }
                    
                    // Calculate and add the total HJ for this profile
                    int profilHJ = CalculateTotalParProfil(matricePL, profil.Numero);
                    totalHJ += profilHJ;
                }
                
                hjParPartenaire[partenaireId] = totalHJ;
            }
            
            return hjParPartenaire;
        }

        public decimal CalculatePourcentHjEY(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            // If inputs are invalid, return 0
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return 0;
            }

            // Calculate the number of HJ for EY profiles
            int hjEY = CalculateNbHJpartEY(matricePL, profiles);
            
            // Calculate the sum of all HJs
            int sumHJ = CalculateSumHJ(matricePL);

            // Avoid division by zero
            if (sumHJ == 0)
            {
                return 0;
            }

            // Calculate and return the percentage (as decimal)
            return (decimal)hjEY / sumHJ * 100;
        }

        public Dictionary<Guid, decimal> CalculatePourcentHjPartenaires(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            var pourcentHjPartenaires = new Dictionary<Guid, decimal>();
            
            // Return empty dictionary if inputs are invalid
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return pourcentHjPartenaires;
            }
            
            // Get the total number of HJ for the entire project
            int totalHJ = CalculateSumHJ(matricePL);
            
            // Avoid division by zero
            if (totalHJ == 0)
            {
                return pourcentHjPartenaires;
            }
            
            // Get the distribution of HJ by partner
            var hjPartenaires = CalculateNbHJPartenaires(matricePL, profiles);
            
            // Calculate the percentage for each partner
            foreach (var partenaire in hjPartenaires)
            {
                Guid partenaireId = partenaire.Key;
                int partenaireHJ = partenaire.Value;
                
                // Calculate the percentage and add to the dictionary
                decimal pourcentage = (decimal)partenaireHJ / totalHJ * 100;
                pourcentHjPartenaires[partenaireId] = pourcentage;
            }
            
            return pourcentHjPartenaires;
        }

        public decimal CalculatePourcentBudgetEY(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            // If inputs are invalid, return 0
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return 0;
            }

            // Calculate budget for EY
            int? budgetEY = CalculateBudgetPartEY(matricePL, profiles);
            
            // Calculate the total budget for the project
            int? totalBudget = CalculateTotalCost(matricePL, profiles);

            // Handle null values or division by zero
            if (budgetEY == null || totalBudget == null || totalBudget == 0)
            {
                return 0;
            }

            // Calculate and return the percentage
            return (decimal)budgetEY.Value / totalBudget.Value * 100;
        }

        public Dictionary<Guid, decimal> CalculatePourcentBudgetPartenaires(List<List<int>>? matricePL, IEnumerable<Profil> profiles)
        {
            var pourcentBudgetPartenaires = new Dictionary<Guid, decimal>();
            
            // Return empty dictionary if inputs are invalid
            if (matricePL == null || !matricePL.Any() || profiles == null || !profiles.Any())
            {
                return pourcentBudgetPartenaires;
            }
            
            // Calculate the total budget for the project
            int? totalBudget = CalculateTotalCost(matricePL, profiles);
            
            // Return empty dictionary if totalBudget is null or zero
            if (totalBudget == null || totalBudget == 0)
            {
                return pourcentBudgetPartenaires;
            }
            
            // Get the distribution of budgets by partner
            var budgetPartenaires = CalculateBudgetsPartenaires(matricePL, profiles);
            
            // Calculate the percentage for each partner
            foreach (var partenaire in budgetPartenaires)
            {
                Guid partenaireId = partenaire.Key;
                int partenaireBudget = partenaire.Value;
                
                // Calculate the percentage and add to the dictionary
                decimal pourcentage = (decimal)partenaireBudget / totalBudget.Value * 100;
                pourcentBudgetPartenaires[partenaireId] = pourcentage;
            }
            
            return pourcentBudgetPartenaires;
        }

        public int? CalculateTotalDepense(Dictionary<TypeDepense, int>? unitsDepense, Dictionary<TypeDepense, int>? prixDepenses)
        {
            // Return null if either dictionary is null or empty
            if (unitsDepense == null || !unitsDepense.Any() || prixDepenses == null || !prixDepenses.Any())
            {
                return null;
            }

            int totalDepense = 0;

            // For each type of expense in the profile's units
            foreach (var unit in unitsDepense)
            {
                // If there's a corresponding price for this type of expense
                if (prixDepenses.TryGetValue(unit.Key, out int prix))
                {
                    // Multiply units by price and add to total
                    totalDepense += unit.Value * prix;
                }
            }

            return totalDepense;
        }
    }

}