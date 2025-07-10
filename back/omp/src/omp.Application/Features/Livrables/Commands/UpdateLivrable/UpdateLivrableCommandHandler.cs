using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Services;
using System.Collections.Generic;
using omp.Domain.Entites;

namespace omp.Application.Features.Livrables.Commands.UpdateLivrable
{
    public class UpdateLivrableCommandHandler : IRequestHandler<UpdateLivrableCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public UpdateLivrableCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<bool> Handle(UpdateLivrableCommand request, CancellationToken cancellationToken)
        {
            var livrable = await _context.Livrables.SingleOrDefaultAsync(l => l.Id == request.Id, cancellationToken);
            
            if (livrable == null)
                return false;

            // Update basic properties
            livrable.Nom = request.Nom;
            livrable.Numero = request.Numero;
            livrable.StartWeek = request.StartWeek;
            livrable.EndWeek = request.EndWeek;
            livrable.Duration = request.Duration;
            livrable.IdPhase = request.IdPhase;
            
            // Calculate derived properties if we have a valid numero and the livrable is associated with a phase
            if (livrable.Numero.HasValue && livrable.IdPhase.HasValue)
            {
                // Get the phase to find the associated proposition financière
                var phase = await _context.Phases
                    .Where(p => p.Id == livrable.IdPhase.Value)
                    .FirstOrDefaultAsync(cancellationToken);
                
                if (phase != null && phase.IdPropositionFinanciere.HasValue)
                {
                    // Get the proposition financière to access the MatricePL
                    var propositionFinanciere = await _context.PropositionsFinancieres
                        .FindAsync(phase.IdPropositionFinanciere.Value);
                    
                    if (propositionFinanciere != null)
                    {
                        // Get all livrables for calculating NumeroInProposition
                        var allLivrables = await _context.Livrables
                            .Where(l => l.IdPhase.HasValue)
                            .ToListAsync(cancellationToken);
                            
                        // Get all phases for this proposition financiere
                        var allPhases = await _context.Phases
                            .Where(p => p.IdPropositionFinanciere == phase.IdPropositionFinanciere)
                            .ToListAsync(cancellationToken);
                            
                        // Calculate the correct NumeroInProposition
                        int numeroInProposition = _calculationsService.CalculateNumeroInProposition(
                            livrable, 
                            allLivrables,
                            allPhases);
                            
                        // Calculate TotalParLivrable using NumeroInProposition
                        livrable.TotalParLivrable = _calculationsService.CalculateTotalParLivrable(
                            propositionFinanciere.MatricePL, 
                            numeroInProposition);
                        
                        // Calculate Pourcentage using NumeroInProposition
                        livrable.Pourcentage = _calculationsService.CalculatePourcentageLivrable(
                            propositionFinanciere.MatricePL,
                            numeroInProposition);
                    }
                }
            }
            else
            {
                // Clear calculated values if missing required data
                livrable.TotalParLivrable = null;
                livrable.Pourcentage = null;
            }
            
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}