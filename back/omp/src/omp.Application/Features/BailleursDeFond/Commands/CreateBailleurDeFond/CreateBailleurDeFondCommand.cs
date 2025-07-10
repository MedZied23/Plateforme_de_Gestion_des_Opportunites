using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.BailleursDeFond.Commands.CreateBailleurDeFond
{
    public class CreateBailleurDeFondCommand : IRequest<Guid>
    {
        public string? NomBailleur { get; set; }
        public Modele? Modele { get; set; }
    }
}