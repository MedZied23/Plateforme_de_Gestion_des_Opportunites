using MediatR;
using omp.Application.Features.Livrables.DTOs;
using System.Collections.Generic;

namespace omp.Application.Features.Livrables.Queries.GetLivrablesList
{
    public class GetLivrablesListQuery : IRequest<List<LivrableDto>>
    {
    }
}