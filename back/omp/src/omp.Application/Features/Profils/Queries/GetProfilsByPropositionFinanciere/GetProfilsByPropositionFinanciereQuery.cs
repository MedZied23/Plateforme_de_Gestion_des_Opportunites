using MediatR;
using omp.Application.Features.Profils.DTOs;

namespace omp.Application.Features.Profils.Queries.GetProfilsByPropositionFinanciere
{
    public class GetProfilsByPropositionFinanciereQuery : IRequest<List<ProfilDto>>
    {
        public Guid PropositionFinanciereId { get; set; }
    }
}