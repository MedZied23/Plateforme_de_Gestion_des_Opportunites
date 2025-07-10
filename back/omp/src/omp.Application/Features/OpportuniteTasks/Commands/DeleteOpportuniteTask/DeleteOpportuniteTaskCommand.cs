using MediatR;

namespace omp.Application.Features.OpportuniteTasks.Commands.DeleteOpportuniteTask
{
    public class DeleteOpportuniteTaskCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}
