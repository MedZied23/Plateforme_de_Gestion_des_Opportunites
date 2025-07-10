using MediatR;
using System;

namespace omp.Application.Features.Phases.Commands.DeletePhase
{
    public class DeletePhaseCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}