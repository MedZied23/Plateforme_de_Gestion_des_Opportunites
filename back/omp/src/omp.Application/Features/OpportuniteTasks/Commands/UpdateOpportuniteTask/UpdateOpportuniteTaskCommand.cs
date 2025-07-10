using MediatR;
using omp.Application.Features.OpportuniteTasks.DTOs;

namespace omp.Application.Features.OpportuniteTasks.Commands.UpdateOpportuniteTask
{
    public class UpdateOpportuniteTaskCommand : OpportuniteTaskDto, IRequest<bool>
    {
        // Inherits all properties from OpportuniteTaskDto
    }
}