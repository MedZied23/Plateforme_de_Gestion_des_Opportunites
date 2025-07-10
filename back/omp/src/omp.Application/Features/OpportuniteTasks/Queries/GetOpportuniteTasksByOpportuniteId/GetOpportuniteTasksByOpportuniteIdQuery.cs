using MediatR;
using omp.Application.Features.OpportuniteTasks.DTOs;

namespace omp.Application.Features.OpportuniteTasks.Queries.GetOpportuniteTasksByOpportuniteId
{
    public class GetOpportuniteTasksByOpportuniteIdQuery : IRequest<List<OpportuniteTaskDto>>
    {
        public Guid OpportuniteId { get; set; }
    }
}