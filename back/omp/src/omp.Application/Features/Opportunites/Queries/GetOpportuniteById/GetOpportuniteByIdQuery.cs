using MediatR;
using omp.Application.Features.Opportunites.DTOs;

namespace omp.Application.Features.Opportunites.Queries.GetOpportuniteById
{
    public class GetOpportuniteByIdQuery : IRequest<OpportuniteDto>
    {
        public Guid Id { get; set; }
    }
}
