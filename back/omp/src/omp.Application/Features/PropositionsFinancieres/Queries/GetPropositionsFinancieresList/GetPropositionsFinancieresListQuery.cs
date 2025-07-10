using System.Collections.Generic;
using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.PropositionsFinancieres.DTOs;

namespace omp.Application.Features.PropositionsFinancieres.Queries.GetPropositionsFinancieresList
{
    public class GetPropositionsFinancieresListQuery : IRequest<PaginatedList<PropositionFinanciereDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 6; // Par défaut, 6 propositions par page comme demandé
        public string SortBy { get; set; } = "DateModification"; // Default sort by modification date
        public string SortDirection { get; set; } = "desc"; // Default sort direction (newest first)
    }
}