using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Services;

namespace omp.Application.Features.Phases.Commands.UpdatePhase
{
    public class UpdatePhaseCommandHandler : IRequestHandler<UpdatePhaseCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public UpdatePhaseCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<bool> Handle(UpdatePhaseCommand request, CancellationToken cancellationToken)
        {
            var phase = await _context.Phases.SingleOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
            
            if (phase == null)
                return false;

            // Update basic properties
            phase.Nom = request.Nom;
            phase.Numero = request.Numero;
            phase.IdPropositionFinanciere = request.IdPropositionFinanciere;
            
            // Calculate derived properties if we have a valid numero and the phase is associated with a proposition financière
            if (phase.Numero.HasValue && phase.IdPropositionFinanciere.HasValue)
            {
                var propositionFinanciere = await _context.PropositionsFinancieres
                    .FindAsync(phase.IdPropositionFinanciere.Value);
                
                if (propositionFinanciere != null)
                {
                    // Get all phases for this proposition financiere
                    var allPhases = await _context.Phases
                        .Where(p => p.IdPropositionFinanciere == phase.IdPropositionFinanciere.Value)
                        .ToListAsync(cancellationToken);
                    
                    // Get all livrables for this phase
                    var livrables = await _context.Livrables
                        .Where(l => l.IdPhase == phase.Id)
                        .ToListAsync(cancellationToken);

                    // Calculate TotalParPhase using the livrables and phases
                    phase.TotalParPhase = _calculationsService.CalculateTotalParPhase(
                        propositionFinanciere.MatricePL, 
                        phase.Id,
                        livrables,
                        allPhases);
                    
                    // Calculate Pourcentage using the livrables and phases
                    phase.Pourcentage = _calculationsService.CalculatePourcentagePhase(
                        propositionFinanciere.MatricePL,
                        phase.Id,
                        livrables,
                        allPhases);
                }
            }
            else
            {
                // Clear calculated values if missing required data
                phase.TotalParPhase = null;
                phase.Pourcentage = null;
            }
            
            await _context.SaveChangesAsync(cancellationToken);

            // If the phase is linked to a proposition financière, update the livrables associated with this phase
            if (phase.IdPropositionFinanciere.HasValue)
            {
                await UpdateLivrablesCalculations(phase.Id, phase.IdPropositionFinanciere.Value, cancellationToken);
            }
            
            return true;
        }

        private async Task UpdateLivrablesCalculations(Guid phaseId, Guid propositionFinanciereId, CancellationToken cancellationToken)
        {
            // Get the proposition financière to access the MatricePL
            var propositionFinanciere = await _context.PropositionsFinancieres
                .FindAsync(propositionFinanciereId);
                
            if (propositionFinanciere == null)
                return;
                
            // Get all livrables associated with this phase
            var livrables = await _context.Livrables
                .Where(l => l.IdPhase == phaseId)
                .ToListAsync(cancellationToken);
                
            // Get all livrables for calculations (needed for NumeroInProposition)
            var allLivrables = await _context.Livrables
                .Where(l => l.IdPhase.HasValue)
                .ToListAsync(cancellationToken);
                
            // Get all phases for this proposition financiere (needed for NumeroInProposition)
            var allPhases = await _context.Phases
                .Where(p => p.IdPropositionFinanciere == propositionFinanciereId)
                .ToListAsync(cancellationToken);
                
            foreach (var livrable in livrables)
            {
                if (livrable.Numero.HasValue)
                {
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
            
            // Save all changes to livrables
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}