using MediatR;
using omp.Application.Features.Opportunites.DTOs;

namespace omp.Application.Features.Opportunites.Commands.UpdateOpportunite
{
    public class UpdateOpportuniteCommand : OpportuniteDto, IRequest<bool>
    {
        // Inherits all properties from OpportuniteDto
    }
}
