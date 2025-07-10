using MediatR;
using omp.Application.Features.Phases.DTOs;
using System.Collections.Generic;

namespace omp.Application.Features.Phases.Queries.GetPhasesList
{
    public class GetPhasesListQuery : IRequest<List<PhaseDto>>
    {
    }
}