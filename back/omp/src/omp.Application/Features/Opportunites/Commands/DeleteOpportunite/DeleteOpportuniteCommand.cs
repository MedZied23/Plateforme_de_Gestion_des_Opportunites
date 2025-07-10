using MediatR;

namespace omp.Application.Features.Opportunites.Commands.DeleteOpportunite
{
    public class DeleteOpportuniteCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}
