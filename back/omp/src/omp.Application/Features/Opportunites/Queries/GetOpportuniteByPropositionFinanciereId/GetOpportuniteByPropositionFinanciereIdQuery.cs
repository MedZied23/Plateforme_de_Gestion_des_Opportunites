using System;
using MediatR;

namespace omp.Application.Features.Opportunites.Queries.GetOpportuniteByPropositionFinanciereId
{
    public class GetOpportuniteByPropositionFinanciereIdQuery : IRequest<Guid?>
    {
        public Guid PropositionFinanciereId { get; set; }
    }
}
