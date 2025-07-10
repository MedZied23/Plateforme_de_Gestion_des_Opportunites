using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Opportunites.Queries.GetOpportuniteByPropositionFinanciereId
{
    public class GetOpportuniteByPropositionFinanciereIdQueryHandler : IRequestHandler<GetOpportuniteByPropositionFinanciereIdQuery, Guid?>
    {
        private readonly IApplicationDbContext _context;

        public GetOpportuniteByPropositionFinanciereIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid?> Handle(GetOpportuniteByPropositionFinanciereIdQuery request, CancellationToken cancellationToken)
        {
            var opportunite = await _context.Opportunites
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.IdPropositionFinanciere == request.PropositionFinanciereId, cancellationToken);

            return opportunite?.Id;
        }
    }
}
