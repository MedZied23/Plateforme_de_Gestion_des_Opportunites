using System.Collections.Generic;
using MediatR;
using omp.Application.Features.Formations.DTOs;

namespace omp.Application.Features.Formations.Queries.GetAllFormations
{
    public class GetAllFormationsQuery : IRequest<List<FormationDto>>
    {
    }
}