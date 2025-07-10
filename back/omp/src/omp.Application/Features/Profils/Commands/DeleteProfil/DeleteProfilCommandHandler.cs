using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Services;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Profils.Commands.DeleteProfil
{
    public class DeleteProfilCommandHandler : IRequestHandler<DeleteProfilCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public DeleteProfilCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<bool> Handle(DeleteProfilCommand request, CancellationToken cancellationToken)
        {
            var profil = await _context.Profils
                .SingleOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
            
            if (profil == null)
                return false;

            // Store profile's proposition financière ID and number before removal
            var propositionFinanciereId = profil.IdPropositionFinanciere;
            var profileNumber = profil.Numero;

            try
            {
                // Simply try to remove the profile directly
                _context.Profils.Remove(profil);
                
                // Try to save changes - this is where the constraint exception might happen
                try
                {
                    await _context.SaveChangesAsync(cancellationToken);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to delete profile with standard approach: {ex.Message}");
                    
                    // Alternative approach: If standard deletion fails due to constraint issues,
                    // try nullifying the foreign key first
                    if (profil.IdPartenaire != null)
                    {
                        profil.IdPartenaire = null;
                        await _context.SaveChangesAsync(cancellationToken);
                        
                        // Try removing again
                        _context.Profils.Remove(profil);
                        await _context.SaveChangesAsync(cancellationToken);
                    }
                    else
                    {
                        // If that also fails, we need to re-throw the exception
                        throw;
                    }
                }
                
                // If successful and the profile was linked to a proposition financière, update matrices
                if (propositionFinanciereId.HasValue && profileNumber.HasValue)
                {
                    await RemoveProfileRowFromMatrices(propositionFinanciereId.Value, profileNumber.Value, cancellationToken);
                }
                
                return true;
            }
            catch (Exception ex)
            {
                // Log the exception for better debugging
                Console.WriteLine($"Error deleting profile: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                // If deletion fails, inform the caller that deletion failed
                return false;
            }
        }

        private async Task RemoveProfileRowFromMatrices(Guid propositionFinanciereId, int profileNumber, CancellationToken cancellationToken)
        {
            var propositionFinanciere = await _context.PropositionsFinancieres
                .FindAsync(propositionFinanciereId);

            if (propositionFinanciere != null)
            {
                // Remove the row from MatricePL if it exists
                if (propositionFinanciere.MatricePL != null && 
                    profileNumber < propositionFinanciere.MatricePL.Count)
                {
                    propositionFinanciere.MatricePL.RemoveAt(profileNumber);
                }
                
                // Remove the row from MatricePLSiege if it exists
                if (propositionFinanciere.MatricePLSiege != null && 
                    profileNumber < propositionFinanciere.MatricePLSiege.Count)
                {
                    propositionFinanciere.MatricePLSiege.RemoveAt(profileNumber);
                }
                
                // Remove the row from MatricePLTerrain if it exists
                if (propositionFinanciere.MatricePLTerrain != null && 
                    profileNumber < propositionFinanciere.MatricePLTerrain.Count)
                {
                    propositionFinanciere.MatricePLTerrain.RemoveAt(profileNumber);
                }
                
                // Update the proposition financière entity
                _context.PropositionsFinancieres.Update(propositionFinanciere);
                await _context.SaveChangesAsync(cancellationToken);
                
                // Update all related calculations
                await UpdatePropositionFinanciereCalculations(propositionFinanciereId, cancellationToken);
            }
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

                // Update remaining profiles to recalculate their values
                foreach (var profile in profiles)
                {
                    if (profile.Numero.HasValue)
                    {
                        profile.TotalParProfil = _calculationsService.CalculateTotalParProfil(
                            propositionFinanciere.MatricePL, 
                            profile.Numero);

                        if (profile.TJM.HasValue)
                        {
                            profile.TotalCostParProfil = (int?)_calculationsService.TotalCostParProfil(
                                propositionFinanciere.MatricePL,
                                profile);
                        }

                        profile.TotalSiege = _calculationsService.CalculateTotalSiege(
                            propositionFinanciere.MatricePLSiege,
                            profile.Numero);

                        profile.TotalTerrain = _calculationsService.CalculateTotalTerrain(
                            propositionFinanciere.MatricePLTerrain,
                            profile.Numero);
                    }
                }

                // Save changes
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}