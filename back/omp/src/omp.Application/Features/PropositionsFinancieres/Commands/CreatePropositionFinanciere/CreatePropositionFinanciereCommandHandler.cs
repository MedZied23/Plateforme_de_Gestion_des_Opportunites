using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using omp.Domain.Services;
using System.Linq;
using System.Collections.Generic;
using System.Text.Json;

namespace omp.Application.Features.PropositionsFinancieres.Commands.CreatePropositionFinanciere
{    public class CreatePropositionFinanciereCommandHandler : IRequestHandler<CreatePropositionFinanciereCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;
        private readonly ICurrentUserService _currentUserService;

        public CreatePropositionFinanciereCommandHandler(IApplicationDbContext context, CalculationsService calculationsService, ICurrentUserService currentUserService)
        {
            _context = context;
            _calculationsService = calculationsService;
            _currentUserService = currentUserService;
        }        public async Task<Guid> Handle(CreatePropositionFinanciereCommand request, CancellationToken cancellationToken)
        {
            // Access control: Only Manager and above can create propositions financieres
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");
            var currentUser = await _context.Users.FindAsync(currentUserId);
            
            if (currentUser == null)
            {
                throw new UnauthorizedAccessException("User not found");
            }
            
            // Only Manager (4), Senior Manager (3), Directeur (2), and Associé (1) can create propositions financieres
            if (currentUser.Role != Role.Manager && 
                currentUser.Role != Role.SeniorManager && 
                currentUser.Role != Role.Directeur && 
                currentUser.Role != Role.Associe)
            {
                throw new UnauthorizedAccessException($"You don't have permission to create propositions financieres. Only Manager, Senior Manager, Directeur, and Associé can create propositions financieres. Your current role: {currentUser.Role}");
            }

            var entity = new PropositionFinanciere
            {
                Id = Guid.NewGuid(),
                Nom = request.Nom,
                DateCreation = DateTime.UtcNow,
                DateModification = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId,
                nbrSemaines = request.nbrSemaines,
                MatricePL = request.MatricePL,
                MatricePLSiege = request.MatricePLSiege,
                MatricePLTerrain = request.MatricePLTerrain
            };

            _context.PropositionsFinancieres.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            // Get only profiles related to this proposition financière
            var profiles = await _context.Profils
                .Where(p => p.IdPropositionFinanciere == entity.Id)
                .ToListAsync(cancellationToken);
            
            // Implement bidirectional update for matricePLSiege and matricePLTerrain
            if (request.MatricePL != null)
            {
                // Ensure we have non-null matrices to work with
                if (request.MatricePLSiege == null) request.MatricePLSiege = new List<List<int>>();
                if (request.MatricePLTerrain == null) request.MatricePLTerrain = new List<List<int>>();

                // For each row in the source matrix
                for (int i = 0; i < request.MatricePL.Count; i++)
                {
                    var row = request.MatricePL[i];

                    // Ensure target matrices have this row
                    while (request.MatricePLSiege.Count <= i)
                    {
                        request.MatricePLSiege.Add(new List<int>(new int[row.Count]));
                    }
                    while (request.MatricePLTerrain.Count <= i)
                    {
                        request.MatricePLTerrain.Add(new List<int>(new int[row.Count]));
                    }
                }
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

            // Update the entity with calculated values
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
            entity.MatricePLSiegeParJour = matricePLSiegeParJour;
            entity.MatricePLTerrainParJour = matricePLTerrainParJour;
            entity.TotalExpenses = request.TotalExpenses;

            // Calculate TotalProjet as sum of TotalCost and TotalExpenses
            entity.TotalProjet = (totalCost ?? 0) + (request.TotalExpenses ?? 0);            entity.NbrJoursParMois = request.NbrJoursParMois;
            entity.prixDepenses = request.prixDepenses;
            entity.LinkTeams = request.LinkTeams;
            entity.Status = request.Status;

            await _context.SaveChangesAsync(cancellationToken);
            
            // Update related entities if any exist
            await UpdateRelatedEntities(entity.Id, request.MatricePL, cancellationToken);

            return entity.Id;
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
                                numeroInProposition);
                        }
                    }
                }
            }
            
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}