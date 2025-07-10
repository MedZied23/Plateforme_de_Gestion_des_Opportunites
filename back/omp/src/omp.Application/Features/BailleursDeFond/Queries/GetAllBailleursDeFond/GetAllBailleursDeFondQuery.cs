using MediatR;
using omp.Application.Features.BailleursDeFond.DTOs;

namespace omp.Application.Features.BailleursDeFond.Queries.GetAllBailleursDeFond
{
    public class GetAllBailleursDeFondQuery : IRequest<List<BailleurDeFondDto>>
    {
    }
}