using MediatR;
using omp.Application.Features.Phases.DTOs;
using System;

namespace omp.Application.Features.Phases.Queries.GetPhaseById
{
    public class GetPhaseByIdQuery : IRequest<PhaseDto>
    {
        public Guid Id { get; set; }
    }
}