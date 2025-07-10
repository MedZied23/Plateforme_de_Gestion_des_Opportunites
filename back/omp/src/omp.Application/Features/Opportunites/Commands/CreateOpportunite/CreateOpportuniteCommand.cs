using MediatR;
using omp.Application.Features.Opportunites.DTOs;

namespace omp.Application.Features.Opportunites.Commands.CreateOpportunite
{
    public class CreateOpportuniteCommand : OpportuniteDto, IRequest<Guid>
    {
        // Inherits all properties from OpportuniteDto
    }
}
