using omp.Domain.Entites;
using System;
using System.Collections.Generic;

namespace omp.Application.Features.Profils.DTOs
{
    public class ProfilDto
    {
        public Guid Id { get; set; }
        public string? NomPrenom { get; set; }
        public int? Numero { get; set; }
        public string? Poste { get; set; }
        public int? TJM { get; set; }
        public int? TotalParProfil { get; set; }
        public int? TotalCostParProfil { get; set; }
        public int? TotalSiege { get; set; }
        public int? TotalTerrain { get; set; }
        public decimal? TotalSiegeParJour { get; set; }
        public decimal? TotalTerrainParJour { get; set; }
        public Dictionary<TypeDepense, int>? UnitsDepense { get; set; } = new Dictionary<TypeDepense, int>();
        public int? TotalDepense { get; set; }
        public Guid IdPartenaire { get; set; }
        public Guid? IdPropositionFinanciere { get; set; }
    }
}