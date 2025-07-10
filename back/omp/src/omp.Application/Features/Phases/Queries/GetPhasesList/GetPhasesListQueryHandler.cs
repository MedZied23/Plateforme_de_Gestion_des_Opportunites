using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Phases.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Phases.Queries.GetPhasesList
{
    public class GetPhasesListQueryHandler : IRequestHandler<GetPhasesListQuery, List<PhaseDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetPhasesListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<PhaseDto>> Handle(GetPhasesListQuery request, CancellationToken cancellationToken)
        {
            return await _context.Phases
                .Select(p => new PhaseDto
                {
                    Id = p.Id,
                    Numero = p.Numero,
                    Nom = p.Nom,
                    TotalParPhase = p.TotalParPhase,
                    Pourcentage = p.Pourcentage,
                    IdPropositionFinanciere = p.IdPropositionFinanciere
                })
                .ToListAsync(cancellationToken);
        }
    }
}