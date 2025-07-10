using MediatR;
using omp.Application.Features.OpportuniteTasks.DTOs;

namespace omp.Application.Features.OpportuniteTasks.Queries.GetOpportuniteTaskById
{
    public class GetOpportuniteTaskByIdQuery : IRequest<OpportuniteTaskDto>
    {
        public Guid Id { get; set; }
    }
}