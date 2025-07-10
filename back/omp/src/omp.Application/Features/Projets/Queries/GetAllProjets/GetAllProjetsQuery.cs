using System.Collections.Generic;
using MediatR;
using omp.Application.Features.Projets.DTOs;

namespace omp.Application.Features.Projets.Queries.GetAllProjets
{
    public class GetAllProjetsQuery : IRequest<List<ProjetDto>>
    {
    }
}