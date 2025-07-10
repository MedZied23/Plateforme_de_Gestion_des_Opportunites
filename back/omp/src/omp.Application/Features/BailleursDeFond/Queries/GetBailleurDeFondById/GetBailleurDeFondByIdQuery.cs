using MediatR;
using omp.Application.Features.BailleursDeFond.DTOs;

namespace omp.Application.Features.BailleursDeFond.Queries.GetBailleurDeFondById
{
    public class GetBailleurDeFondByIdQuery : IRequest<BailleurDeFondDto>
    {
        public Guid Id { get; set; }
    }
}