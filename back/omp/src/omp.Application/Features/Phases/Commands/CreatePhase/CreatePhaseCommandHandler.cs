using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using omp.Domain.Services;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Phases.Commands.CreatePhase
{
    public class CreatePhaseCommandHandler : IRequestHandler<CreatePhaseCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public CreatePhaseCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<Guid> Handle(CreatePhaseCommand request, CancellationToken cancellationToken)
        {
            var entity = new Phase
            {
                Id = Guid.NewGuid(),
                Numero = request.Numero,
                Nom = request.Nom,
                IdPropositionFinanciere = request.IdPropositionFinanciere
            };

            // Only calculate if this phase is linked to a proposition financière and has the necessary data
            if (request.IdPropositionFinanciere.HasValue && request.Numero.HasValue)
            {
                var propositionFinanciere = await _context.PropositionsFinancieres
                    .FindAsync(request.IdPropositionFinanciere.Value);

                if (propositionFinanciere != null)
                {
                    // Get all phases for this proposition financiere
                    var allPhases = await _context.Phases
                        .Where(p => p.IdPropositionFinanciere == request.IdPropositionFinanciere.Value)
                        .ToListAsync(cancellationToken);
                    
                    // Add the current phase to the list for calculations
                    allPhases.Add(entity);
                    
                    // Get all livrables for this proposition financiere
                    var livrables = _context.Livrables
                        .Where(l => l.IdPhase == entity.Id)
                        .ToList();

                    // Calculate phase values using CalculationsService with the livrables and phases
                    entity.TotalParPhase = _calculationsService.CalculateTotalParPhase(
                        propositionFinanciere.MatricePL, 
                        entity.Id,
                        livrables,
                        allPhases);
                    
                    entity.Pourcentage = _calculationsService.CalculatePourcentagePhase(
                        propositionFinanciere.MatricePL,
                        entity.Id,
                        livrables,
                        allPhases);
                }
            }

            _context.Phases.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}