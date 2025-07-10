using MediatR;
using omp.Application.Features.Livrables.DTOs;
using System;
using System.Collections.Generic;

namespace omp.Application.Features.Livrables.Queries.GetLivrablesByPropositionFinanciereId
{
    public class GetLivrablesByPropositionFinanciereIdQuery : IRequest<List<LivrableDto>>
    {
        public Guid PropositionFinanciereId { get; set; }
    }
}