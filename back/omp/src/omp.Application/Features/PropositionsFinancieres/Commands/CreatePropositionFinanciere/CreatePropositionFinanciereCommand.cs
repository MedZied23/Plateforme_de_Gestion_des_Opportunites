using System;
using System.Collections.Generic;
using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.PropositionsFinancieres.Commands.CreatePropositionFinanciere
{    public class CreatePropositionFinanciereCommand : IRequest<Guid>
    {
        public string? Nom { get; set; }
        // DateCreation and DateModification will be set in the handler
        public int? nbrSemaines { get; set; }
        public List<List<int>>? MatricePL { get; set; } = new();
        public List<List<int>>? MatricePLSiege { get; set; } = new();
        public List<List<int>>? MatricePLTerrain { get; set; } = new();
        public List<List<decimal>>? MatricePLSiegeParJour { get; set; } = new(); // HJ
        public List<List<decimal>>? MatricePLTerrainParJour { get; set; } = new(); // HJ
        public int? TotalCost { get; set; }
        public decimal? AverageTJM { get; set; }
        public int? SumHJ { get; set; }
        public int? BudgetPartEY { get; set; }
        public Dictionary<Guid, int>? BudgetsPartenaires { get; set; } = new();
        public int? NbrHJPartEY { get; set; }
        public Dictionary<Guid, int>? NbrHJPartenaires { get; set; } = new();
        public decimal? PourcentHjEY { get; set; }
        public Dictionary<Guid, float>? PourcentHjPartenaires { get; set; } = new();
        public decimal? PourcentBudgetEY { get; set; }
        public Dictionary<Guid, float>? PourcentBudgetPartenaires { get; set; } = new();        public int? TotalExpenses { get; set; }
        public int? TotalProjet { get; set; }        public decimal? NbrJoursParMois { get; set; }
        public Dictionary<TypeDepense, int>? prixDepenses { get; set; } = new();
        public string? LinkTeams { get; set; }
        public Status? Status { get; set; }
    }
}