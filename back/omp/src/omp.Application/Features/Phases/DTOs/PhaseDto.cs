using System;

namespace omp.Application.Features.Phases.DTOs
{
    public class PhaseDto
    {
        public Guid Id { get; set; }
        public int? Numero { get; set; }
        public string? Nom { get; set; }
        public int? TotalParPhase { get; set; }
        public decimal? Pourcentage { get; set; }
        public Guid? IdPropositionFinanciere { get; set; }
    }
}