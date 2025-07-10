using System;

namespace omp.Domain.Entites
{
    public class Phase
    {
        public Guid Id { get; set; }
        public int? Numero { get; set; }
        public string? Nom { get; set; }
        public int? TotalParPhase { get; set; }
        public decimal? Pourcentage { get; set; }
        public Guid? IdPropositionFinanciere { get; set; }
    }
}