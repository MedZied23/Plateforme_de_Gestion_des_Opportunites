using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using omp.Domain.Services;

namespace omp.Application.Features.PropositionsFinancieres.Commands.UpdatePropositionFinanciere
{    public class UpdatePropositionFinanciereCommandHandler : IRequestHandler<UpdatePropositionFinanciereCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;
        private readonly ICurrentUserService _currentUserService;

        public UpdatePropositionFinanciereCommandHandler(IApplicationDbContext context, CalculationsService calculationsService, ICurrentUserService currentUserService)
        {
            _context = context;
            _calculationsService = calculationsService;
            _currentUserService = currentUserService;
        }

        public async Task<bool> Handle(UpdatePropositionFinanciereCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");
            
            var entity = await _context.PropositionsFinancieres.FindAsync(request.Id);
            
            if (entity == null) return false;

            // Check access control
            await CheckPropositionEditAccess(entity, currentUserId, cancellationToken);

            // Get profiles needed for calculations - now fetch directly from the database
            var profiles = await _context.Profils
                .Where(p => p.IdPropositionFinanciere == request.Id)
                .ToListAsync(cancellationToken);
            
            // Check if MatricePL has changed to avoid unnecessary recalculation
            bool matriceChanged = !AreMatricesEqual(entity.MatricePL, request.MatricePL);
            bool siegeOrTerrainChanged = false;
            
            // Implement bidirectional update for matricePLSiege and matricePLTerrain
            if (request.MatricePL != null)
            {
                // Check if MatricePLSiege has been explicitly set by comparing to the stored value
                bool matricePLSiegeChanged = !AreMatricesEqual(entity.MatricePLSiege, request.MatricePLSiege);
                // Check if MatricePLTerrain has been explicitly set by comparing to the stored value
                bool matricePLTerrainChanged = !AreMatricesEqual(entity.MatricePLTerrain, request.MatricePLTerrain);
                
                // Set flag to update TotalSiege and TotalTerrain if any related matrix changed
                siegeOrTerrainChanged = matricePLSiegeChanged || matricePLTerrainChanged;

                // Ensure we have non-null matrices to work with
                if (request.MatricePLSiege == null) request.MatricePLSiege = new List<List<int>>();
                if (request.MatricePLTerrain == null) request.MatricePLTerrain = new List<List<int>>();

                if (matricePLSiegeChanged && !matricePLTerrainChanged)
                {
                    // If MatricePLSiege was updated, calculate MatricePLTerrain = MatricePL - MatricePLSiege
                    request.MatricePLTerrain = SubtractMatrices(request.MatricePL, request.MatricePLSiege);
                    Console.WriteLine($"MatricePLTerrain updated: {JsonSerializer.Serialize(request.MatricePLTerrain)}");
                }
                else if (matricePLTerrainChanged && !matricePLSiegeChanged)
                {
                    // If MatricePLTerrain was updated, calculate MatricePLSiege = MatricePL - MatricePLTerrain
                    request.MatricePLSiege = SubtractMatrices(request.MatricePL, request.MatricePLTerrain);
                }
                // If both matrices were explicitly provided or none were changed, we don't need to recalculate
            }
            
            // Perform calculations using the CalculationsService
            var sumHJ = _calculationsService.CalculateSumHJ(request.MatricePL);
            var totalCost = _calculationsService.CalculateTotalCost(request.MatricePL, profiles);
            var averageTJM = _calculationsService.CalculateAverageTJM(profiles);
            var budgetPartEY = _calculationsService.CalculateBudgetPartEY(request.MatricePL, profiles);
            var budgetsPartenaires = _calculationsService.CalculateBudgetsPartenaires(request.MatricePL, profiles);
            var nbrHJPartEY = _calculationsService.CalculateNbHJpartEY(request.MatricePL, profiles);
            var nbrHJPartenaires = _calculationsService.CalculateNbHJPartenaires(request.MatricePL, profiles);
            var pourcentHjEY = _calculationsService.CalculatePourcentHjEY(request.MatricePL, profiles);
            var pourcentHjPartenaires = _calculationsService.CalculatePourcentHjPartenaires(request.MatricePL, profiles);
            var pourcentBudgetEY = _calculationsService.CalculatePourcentBudgetEY(request.MatricePL, profiles);
            var pourcentBudgetPartenaires = _calculationsService.CalculatePourcentBudgetPartenaires(request.MatricePL, profiles);
            
            // Calculate MatricePLSiegeParJour and MatricePLTerrainParJour
            var matricePLSiegeParJour = _calculationsService.CalculateMatricePLSiegeParJour(request.MatricePLSiege, request.NbrJoursParMois);
            var matricePLTerrainParJour = _calculationsService.CalculateMatricePLTerrainParJour(request.MatricePLTerrain, request.NbrJoursParMois);

            entity.Nom = request.Nom;
            entity.DateModification = DateTime.UtcNow; // Update modification date
            entity.nbrSemaines = request.nbrSemaines;
            entity.MatricePL = request.MatricePL;
            entity.MatricePLSiege = request.MatricePLSiege;
            entity.MatricePLTerrain = request.MatricePLTerrain;
            entity.MatricePLSiegeParJour = matricePLSiegeParJour;
            entity.MatricePLTerrainParJour = matricePLTerrainParJour;
            entity.TotalCost = totalCost;
            entity.AverageTJM = averageTJM; 
            entity.SumHJ = sumHJ;
            entity.BudgetPartEY = budgetPartEY;
            entity.BudgetsPartenaires = budgetsPartenaires;
            entity.NbrHJPartEY = nbrHJPartEY;
            entity.NbrHJPartenaires = nbrHJPartenaires;
            entity.PourcentHjEY = pourcentHjEY;
            entity.PourcentHjPartenaires = pourcentHjPartenaires;
            entity.PourcentBudgetEY = pourcentBudgetEY;
            entity.PourcentBudgetPartenaires = pourcentBudgetPartenaires;
            entity.TotalExpenses = request.TotalExpenses;

            // Calculate TotalProjet as sum of TotalCost and TotalExpenses
            entity.TotalProjet = (totalCost ?? 0) + (request.TotalExpenses ?? 0);            entity.NbrJoursParMois = request.NbrJoursParMois;
            entity.prixDepenses = request.prixDepenses;
            entity.LinkTeams = request.LinkTeams;
            entity.Status = request.Status;

            // First update any related entities if necessary
            if (matriceChanged)
            {
                // If MatricePL changed, update all related entities
                await UpdatePhasesAndLivrablesCalculations(request.Id, request.MatricePL, cancellationToken);
            }
            
            // If MatricePL changed or only Siege/Terrain matrices changed, update profil calculations
            if (matriceChanged || siegeOrTerrainChanged)
            {
                await UpdateProfilsCalculations(request.Id, request.MatricePL, cancellationToken);
            }
            
            // Now save changes to the database
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
        
        /// <summary>
        /// Subtracts one matrix from another, returning a new matrix with the result
        /// </summary>
        private List<List<int>> SubtractMatrices(List<List<int>>? matrix1, List<List<int>>? matrix2)
        {
            // Handle null cases
            if (matrix1 == null) return new List<List<int>>();
            if (matrix2 == null) return new List<List<int>>(matrix1);
            
            var result = new List<List<int>>();
            
            // Create a matrix with the same dimensions as matrix1
            for (int i = 0; i < matrix1.Count; i++)
            {
                var row = new List<int>();
                for (int j = 0; j < matrix1[i].Count; j++)
                {
                    int value1 = matrix1[i][j];
                    // For matrix2, check bounds and use 0 if out of bounds
                    int value2 = (i < matrix2.Count && j < matrix2[i].Count) ? matrix2[i][j] : 0;
                    row.Add(Math.Max(0, value1 - value2)); // Ensure result is not negative
                }
                result.Add(row);
            }
            
            return result;
        }
        
        private bool AreMatricesEqual(List<List<int>>? matrice1, List<List<int>>? matrice2)
        {
            // If both are null, they're equal
            if (matrice1 == null && matrice2 == null) return true;
            // If one is null but not the other, they're not equal
            if (matrice1 == null || matrice2 == null) return false;
            
            // If they have different numbers of rows, they're not equal
            if (matrice1.Count != matrice2.Count) return false;
            
            for (int i = 0; i < matrice1.Count; i++)
            {
                // If rows have different lengths, they're not equal
                if (matrice1[i].Count != matrice2[i].Count) return false;
                
                // Compare each element
                for (int j = 0; j < matrice1[i].Count; j++)
                {
                    if (matrice1[i][j] != matrice2[i][j]) return false;
                }
            }
            
            return true;
        }
        
        private async Task UpdateRelatedEntities(Guid propositionFinanciereId, List<List<int>>? matricePL, CancellationToken cancellationToken)
        {
            // Update profils
            await UpdateProfilsCalculations(propositionFinanciereId, matricePL, cancellationToken);
            
            // Update phases and livrables
            await UpdatePhasesAndLivrablesCalculations(propositionFinanciereId, matricePL, cancellationToken);
        }
        
        private async Task UpdateProfilsCalculations(Guid propositionFinanciereId, List<List<int>>? matricePL, CancellationToken cancellationToken)
        {
            // Get all profils related to this proposition financière
            var profils = await _context.Profils
                .Where(p => p.IdPropositionFinanciere == propositionFinanciereId)
                .ToListAsync(cancellationToken);
            
            // Get the proposition financière for access to matrices and prices
            var propositionFinanciere = await _context.PropositionsFinancieres
                .FindAsync(propositionFinanciereId);
                
            if (propositionFinanciere == null) return;
                
            foreach (var profil in profils)
            {
                if (profil.Numero.HasValue)
                {
                    // Update profil's calculated fields
                    profil.TotalParProfil = _calculationsService.CalculateTotalParProfil(
                        matricePL, 
                        profil.Numero);
                    
                    profil.TotalCostParProfil = profil.TJM.HasValue ? 
                        profil.TotalParProfil * profil.TJM : null;
                    
                    profil.TotalSiege = _calculationsService.CalculateTotalSiege(
                        propositionFinanciere.MatricePLSiege,
                        profil.Numero);
                    
                    profil.TotalTerrain = _calculationsService.CalculateTotalTerrain(
                        propositionFinanciere.MatricePLTerrain,
                        profil.Numero);
                        
                    // Calculate daily values for siege and terrain
                    profil.TotalSiegeParJour = _calculationsService.CalculateTotalSiegeParJour(
                        profil.TotalSiege.Value,
                        propositionFinanciere.NbrJoursParMois);
                        
                    profil.TotalTerrainParJour = _calculationsService.CalculateTotalTerrainParJour(
                        profil.TotalTerrain.Value,
                        propositionFinanciere.NbrJoursParMois);

                    // Calculate total expenses if both units and prices are available
                    if (profil.UnitsDepense != null && propositionFinanciere.prixDepenses != null)
                    {
                        profil.TotalDepense = _calculationsService.CalculateTotalDepense(
                            profil.UnitsDepense,
                            propositionFinanciere.prixDepenses);
                    }
                }
            }
            
            await _context.SaveChangesAsync(cancellationToken);
        }
        
        private async Task UpdatePhasesAndLivrablesCalculations(Guid propositionFinanciereId, List<List<int>>? matricePL, CancellationToken cancellationToken)
        {
            // Get all phases related to this proposition financière
            var phases = await _context.Phases
                .Where(p => p.IdPropositionFinanciere == propositionFinanciereId)
                .ToListAsync(cancellationToken);
            
            // Get all livrables for calculations
            var allLivrables = await _context.Livrables
                .Where(l => l.IdPhase.HasValue)
                .ToListAsync(cancellationToken);
            
            foreach (var phase in phases)
            {
                if (phase.Numero.HasValue)
                {
                    // Update phase's calculated fields using the updated methods with phases parameter
                    phase.TotalParPhase = _calculationsService.CalculateTotalParPhase(
                        matricePL, 
                        phase.Id,
                        allLivrables,
                        phases);
                    
                    phase.Pourcentage = _calculationsService.CalculatePourcentagePhase(
                        matricePL,
                        phase.Id,
                        allLivrables,
                        phases);
                    
                    // Get all livrables related to this phase
                    var livrables = allLivrables.Where(l => l.IdPhase == phase.Id).ToList();
                    
                    foreach (var livrable in livrables)
                    {
                        if (livrable.Numero.HasValue)
                        {
                            // Calculate the correct NumeroInProposition with phases parameter
                            int numeroInProposition = _calculationsService.CalculateNumeroInProposition(
                                livrable, 
                                allLivrables,
                                phases);
                                
                            // Update livrable's calculated fields using NumeroInProposition
                            livrable.TotalParLivrable = _calculationsService.CalculateTotalParLivrable(
                                matricePL, 
                                numeroInProposition);
                            
                            livrable.Pourcentage = _calculationsService.CalculatePourcentageLivrable(
                                matricePL,
                                numeroInProposition);                        }
                    }
                }
            }
            
            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task CheckPropositionEditAccess(PropositionFinanciere proposition, Guid currentUserId, CancellationToken cancellationToken)
        {
            // Check if proposition is linked to an opportunity
            var linkedOpportunity = await _context.Opportunites
                .Where(o => o.IdPropositionFinanciere == proposition.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (linkedOpportunity != null)
            {
                // Proposition is linked to an opportunity
                // Only manager en charge, co-manager en charge, senior manager en charge and associe en charge can edit it
                bool canEdit = linkedOpportunity.ManagerEnCharge == currentUserId ||
                             linkedOpportunity.CoManagerEnCharge == currentUserId ||
                             linkedOpportunity.SeniorManagerEnCharge == currentUserId ||
                             linkedOpportunity.AssocieEnCharge == currentUserId;

                if (!canEdit)
                {
                    throw new UnauthorizedAccessException("You don't have permission to edit this proposition financiere. Only the manager en charge, co-manager en charge, senior manager en charge, and associe en charge of the linked opportunity can edit it.");
                }
            }
            else
            {
                // Proposition is not linked to an opportunity
                // Only the person who created it can edit it
                if (proposition.CreatedBy != currentUserId)
                {
                    throw new UnauthorizedAccessException("You don't have permission to edit this proposition financiere. Only the creator can edit propositions that are not linked to an opportunity.");
                }
            }
        }
    }
}