using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Phases.DTOs;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Phases.Queries.GetPhaseById
{
    public class GetPhaseByIdQueryHandler : IRequestHandler<GetPhaseByIdQuery, PhaseDto>
    {
        private readonly IApplicationDbContext _context;

        public GetPhaseByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PhaseDto> Handle(GetPhaseByIdQuery request, CancellationToken cancellationToken)
        {
            return await _context.Phases
                .Where(p => p.Id == request.Id)
                .Select(p => new PhaseDto
                {
                    Id = p.Id,
                    Numero = p.Numero,
                    Nom = p.Nom,
                    TotalParPhase = p.TotalParPhase,
                    Pourcentage = p.Pourcentage,
                    IdPropositionFinanciere = p.IdPropositionFinanciere
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}