using MediatR;
using System;

namespace omp.Application.Features.Phases.Commands.UpdatePhase
{
    public class UpdatePhaseCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public int? Numero { get; set; }
        public string? Nom { get; set; }
        public int? TotalParPhase { get; set; }
        public float? Pourcentage { get; set; }
        public Guid? IdPropositionFinanciere { get; set; }
    }
}