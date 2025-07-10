using System;

namespace omp.Application.Features.Livrables.DTOs
{
    public class LivrableDto
    {
        public Guid Id { get; set; }
        public string Nom { get; set; }
        public int? Numero { get; set; }
        public int? StartWeek { get; set; }
        public int? EndWeek { get; set; }
        public int? Duration { get; set; }
        public int? TotalParLivrable { get; set; }
        public decimal? Pourcentage { get; set; }
        public Guid? IdPhase { get; set; }
    }
}