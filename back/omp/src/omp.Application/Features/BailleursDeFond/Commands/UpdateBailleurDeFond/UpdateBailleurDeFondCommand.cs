using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.BailleursDeFond.Commands.UpdateBailleurDeFond
{
    public class UpdateBailleurDeFondCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public string? NomBailleur { get; set; }
        public Modele? Modele { get; set; }
    }
}