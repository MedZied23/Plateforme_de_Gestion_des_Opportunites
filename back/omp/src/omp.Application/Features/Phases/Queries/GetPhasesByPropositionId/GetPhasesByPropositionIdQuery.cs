using MediatR;
using omp.Application.Features.Phases.DTOs;
using System;
using System.Collections.Generic;

namespace omp.Application.Features.Phases.Queries.GetPhasesByPropositionId
{
    public class GetPhasesByPropositionIdQuery : IRequest<List<PhaseDto>>
    {
        public Guid PropositionId { get; set; }
    }
}