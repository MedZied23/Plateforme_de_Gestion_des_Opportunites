using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using omp.Domain.Services;

namespace omp.Application.Features.Profils.Commands.CreateProfil
{
    public class CreateProfilCommandHandler : IRequestHandler<CreateProfilCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public CreateProfilCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<Guid> Handle(CreateProfilCommand request, CancellationToken cancellationToken)
        {
            // Handle empty GUID as null for IdPartenaire
            if (request.IdPartenaire.HasValue && request.IdPartenaire.Value == Guid.Empty)
            {
                request.IdPartenaire = null;
            }

            var profil = new Profil
            {
                Id = Guid.NewGuid(),
                NomPrenom = request.NomPrenom,
                Numero = request.Numero,
                Poste = request.Poste,
                TJM = request.TJM,
                IdPartenaire = request.IdPartenaire,  // Will be null for empty GUID
                IdPropositionFinanciere = request.IdPropositionFinanciere,
                UnitsDepense = request.UnitsDepense,
                TotalDepense = request.TotalDepense
            };

            // Only perform calculations if this profil is linked to a proposition financière and has the necessary data
            if (request.IdPropositionFinanciere.HasValue && request.Numero.HasValue)
            {
                var propositionFinanciere = await _context.PropositionsFinancieres
                    .FindAsync(request.IdPropositionFinanciere.Value);

                if (propositionFinanciere != null)
                {
                    // Add a row of zeros to each matrix for the new profile
                    AddRowToMatrices(propositionFinanciere);
                    
                    // Save the matrix changes immediately before adding the profile
                    await _context.SaveChangesAsync(cancellationToken);
                    
                    // Calculate TotalParProfil
                    profil.TotalParProfil = _calculationsService.CalculateTotalParProfil(
                        propositionFinanciere.MatricePL, 
                        profil.Numero);

                    // Calculate TotalCostParProfil
                    if (profil.TJM.HasValue)
                    {
                        profil.TotalCostParProfil = (int?)_calculationsService.TotalCostParProfil(
                            propositionFinanciere.MatricePL,
                            profil);
                    }

                    // Calculate TotalSiege
                    profil.TotalSiege = _calculationsService.CalculateTotalSiege(
                        propositionFinanciere.MatricePLSiege,
                        profil.Numero);

                    // Calculate TotalTerrain
                    profil.TotalTerrain = _calculationsService.CalculateTotalTerrain(
                        propositionFinanciere.MatricePLTerrain,
                        profil.Numero);
 
                }
            }

            _context.Profils.Add(profil);
            await _context.SaveChangesAsync(cancellationToken);

            // If this profile is associated with a proposition financière, 
            // update the proposition financière's calculated fields
            if (request.IdPropositionFinanciere.HasValue)
            {
                await UpdatePropositionFinanciereCalculations(request.IdPropositionFinanciere.Value, cancellationToken);
            }

            return profil.Id;
        }

        // Adds a row of zeros to all matrices in the PropositionFinanciere
        private void AddRowToMatrices(PropositionFinanciere propositionFinanciere)
        {
            // Add row to MatricePL if it exists
            if (propositionFinanciere.MatricePL != null && propositionFinanciere.MatricePL.Any())
            {
                int columnCount = propositionFinanciere.MatricePL[0].Count;
                List<int> newRow = Enumerable.Repeat(0, columnCount).ToList();
                propositionFinanciere.MatricePL.Add(newRow);
            }
            else if (propositionFinanciere.MatricePL == null)
            {
                // Initialize MatricePL if it doesn't exist
                propositionFinanciere.MatricePL = new List<List<int>> { new List<int>() };
            }
            
            // Add row to MatricePLSiege if it exists
            if (propositionFinanciere.MatricePLSiege != null && propositionFinanciere.MatricePLSiege.Any())
            {
                int columnCount = propositionFinanciere.MatricePLSiege[0].Count;
                List<int> newRow = Enumerable.Repeat(0, columnCount).ToList();
                propositionFinanciere.MatricePLSiege.Add(newRow);
            }
            else if (propositionFinanciere.MatricePLSiege == null)
            {
                // Initialize MatricePLSiege if it doesn't exist
                propositionFinanciere.MatricePLSiege = new List<List<int>> { new List<int>() };
            }
            
            // Add row to MatricePLTerrain if it exists
            if (propositionFinanciere.MatricePLTerrain != null && propositionFinanciere.MatricePLTerrain.Any())
            {
                int columnCount = propositionFinanciere.MatricePLTerrain[0].Count;
                List<int> newRow = Enumerable.Repeat(0, columnCount).ToList();
                propositionFinanciere.MatricePLTerrain.Add(newRow);
            }
            else if (propositionFinanciere.MatricePLTerrain == null)
            {
                // Initialize MatricePLTerrain if it doesn't exist
                propositionFinanciere.MatricePLTerrain = new List<List<int>> { new List<int>() };
            }
            
            // Mark the entity as modified
            _context.PropositionsFinancieres.Update(propositionFinanciere);
        }

        private async Task UpdatePropositionFinanciereCalculations(Guid propositionFinanciereId, CancellationToken cancellationToken)
        {
            var propositionFinanciere = await _context.PropositionsFinancieres
                .FindAsync(propositionFinanciereId);

            if (propositionFinanciere != null)
            {
                // Get all profiles associated with this proposition financière
                var profiles = await _context.Profils
                    .Where(p => p.IdPropositionFinanciere == propositionFinanciereId)
                    .ToListAsync(cancellationToken);

                // Recalculate values
                propositionFinanciere.SumHJ = _calculationsService.CalculateSumHJ(propositionFinanciere.MatricePL);
                propositionFinanciere.TotalCost = _calculationsService.CalculateTotalCost(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.AverageTJM = _calculationsService.CalculateAverageTJM(profiles);
                propositionFinanciere.BudgetPartEY = _calculationsService.CalculateBudgetPartEY(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.BudgetsPartenaires = _calculationsService.CalculateBudgetsPartenaires(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.NbrHJPartEY = _calculationsService.CalculateNbHJpartEY(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.NbrHJPartenaires = _calculationsService.CalculateNbHJPartenaires(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.PourcentHjEY = _calculationsService.CalculatePourcentHjEY(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.PourcentHjPartenaires = _calculationsService.CalculatePourcentHjPartenaires(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.PourcentBudgetEY = _calculationsService.CalculatePourcentBudgetEY(propositionFinanciere.MatricePL, profiles);
                propositionFinanciere.PourcentBudgetPartenaires = _calculationsService.CalculatePourcentBudgetPartenaires(propositionFinanciere.MatricePL, profiles);

                // Save changes
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}