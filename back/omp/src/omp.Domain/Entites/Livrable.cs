using System;

namespace omp.Domain.Entites
{
    public class Livrable
    {
        public Guid Id { get; set; }
        public string? Nom { get; set; }
        public int? Numero { get; set; }
        public int? StartWeek { get; set; } // En semaines (weeks)
        public int? EndWeek { get; set; } // En semaines (weeks)
        public int? Duration { get; set; } // En semaines (weeks)
        public int? TotalParLivrable { get; set; } // En HJ (Homme Jour)
        public decimal? Pourcentage { get; set; }
        public Guid? IdPhase { get; set; }
    }
}