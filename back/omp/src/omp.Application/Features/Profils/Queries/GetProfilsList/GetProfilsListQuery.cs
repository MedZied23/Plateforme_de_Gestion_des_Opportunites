using MediatR;
using omp.Application.Features.Profils.DTOs;

namespace omp.Application.Features.Profils.Queries.GetProfilsList
{
    public class GetProfilsListQuery : IRequest<List<ProfilDto>>
    {
    }
}