using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Livrables.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Livrables.Queries.GetLivrablesByPropositionFinanciereId
{
    public class GetLivrablesByPropositionFinanciereIdQueryHandler : IRequestHandler<GetLivrablesByPropositionFinanciereIdQuery, List<LivrableDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetLivrablesByPropositionFinanciereIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<LivrableDto>> Handle(GetLivrablesByPropositionFinanciereIdQuery request, CancellationToken cancellationToken)
        {
            // Get all phases associated with the proposition financiere
            var phaseIds = await _context.Phases
                .Where(p => p.IdPropositionFinanciere == request.PropositionFinanciereId)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            // Get all livrables associated with these phases
            return await _context.Livrables
                .Where(l => l.IdPhase.HasValue && phaseIds.Contains(l.IdPhase.Value))
                .Select(l => new LivrableDto
                {
                    Id = l.Id,
                    Nom = l.Nom,
                    Numero = l.Numero,
                    StartWeek = l.StartWeek,
                    EndWeek = l.EndWeek,
                    Duration = l.Duration,
                    TotalParLivrable = l.TotalParLivrable,
                    Pourcentage = l.Pourcentage,
                    IdPhase = l.IdPhase
                })
                .ToListAsync(cancellationToken);
        }
    }
}