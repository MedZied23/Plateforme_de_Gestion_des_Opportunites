using MediatR;

namespace omp.Application.Features.BailleursDeFond.Commands.DeleteBailleurDeFond
{
    public class DeleteBailleurDeFondCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}