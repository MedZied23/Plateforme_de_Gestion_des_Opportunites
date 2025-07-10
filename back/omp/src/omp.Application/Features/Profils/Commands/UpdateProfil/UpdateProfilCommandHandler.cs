using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Services;
using omp.Domain.Entites;

namespace omp.Application.Features.Profils.Commands.UpdateProfil
{
    public class UpdateProfilCommandHandler : IRequestHandler<UpdateProfilCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public UpdateProfilCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<bool> Handle(UpdateProfilCommand request, CancellationToken cancellationToken)
        {
            var profil = await _context.Profils.SingleOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
            
            if (profil == null)
                return false;
            // Store the previous proposition financière ID for comparison
            var previousPropositionFinanciereId = profil.IdPropositionFinanciere;
            
            // Validate partner ID if one is provided and not empty GUID
            if (request.IdPartenaire.HasValue && request.IdPartenaire.Value != Guid.Empty)
            {
                Console.WriteLine($"Attempting to set IdPartenaire to: {request.IdPartenaire.Value}");
                var partnerExists = await _context.Partenaires
                    .AnyAsync(p => p.Id == request.IdPartenaire.Value, cancellationToken);
                if (!partnerExists)
                {
                    Console.WriteLine($"Partner with ID {request.IdPartenaire.Value} was not found in database");
                    throw new InvalidOperationException($"Le partenaire avec l'ID {request.IdPartenaire.Value} n'existe pas.");
                }
                Console.WriteLine($"Partner with ID {request.IdPartenaire.Value} was found in database");
            }
            else
            {
                // If it's null or empty GUID, set it to null
                Console.WriteLine("Setting IdPartenaire to null");
                request.IdPartenaire = null;
            }
            
            // Update basic properties
            profil.NomPrenom = request.NomPrenom;
            profil.Numero = request.Numero;
            profil.Poste = request.Poste;
            profil.TJM = request.TJM;
            profil.IdPartenaire = request.IdPartenaire;  // Will be null for empty GUID
            profil.IdPropositionFinanciere = request.IdPropositionFinanciere;

            // Update expense-related properties ensuring we don't lose the dictionary instance
            if (request.UnitsDepense != null)
            {
                profil.UnitsDepense = new Dictionary<TypeDepense, int>(request.UnitsDepense);
            }
            else
            {
                profil.UnitsDepense = new Dictionary<TypeDepense, int>();
            }
            profil.TotalDepense = request.TotalDepense;            // Update entity status to make sure EF tracks the changes
            _context.Profils.Update(profil);

            // Save the profil changes first
            await _context.SaveChangesAsync(cancellationToken);
            
            // Only perform calculations if this profil is linked to a proposition financière and has the necessary data
            if (request.IdPropositionFinanciere.HasValue && request.Numero.HasValue)
            {
                var propositionFinanciere = await _context.PropositionsFinancieres
                    .FindAsync(request.IdPropositionFinanciere.Value);

                if (propositionFinanciere != null)
                {
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
                    
                    // Save the calculated values
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
            else
            {
                // Clear calculated values if not linked to a proposition financière
                profil.TotalParProfil = null;
                profil.TotalCostParProfil = null;
                profil.TotalSiege = null;
                profil.TotalTerrain = null;
                
                // Save the cleared values
                await _context.SaveChangesAsync(cancellationToken);
            }
            
            // Update proposition financière calculations if associated
            if (request.IdPropositionFinanciere.HasValue)
            {
                await UpdatePropositionFinanciereCalculations(request.IdPropositionFinanciere.Value, cancellationToken);
            }
            
            // If the profil was moved from one proposition financière to another, update the previous one too
            if (previousPropositionFinanciereId.HasValue && previousPropositionFinanciereId != request.IdPropositionFinanciere)
            {
                await UpdatePropositionFinanciereCalculations(previousPropositionFinanciereId.Value, cancellationToken);
            }
            
            return true;
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
                
                // No need to call SaveChangesAsync here as it will be called in the Handle method
            }
        }
    }
}