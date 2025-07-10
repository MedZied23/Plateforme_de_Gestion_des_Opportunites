using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.Opportunites.DTOs;

namespace omp.Application.Features.Opportunites.Queries.GetUserOpportunitesList
{
    public class GetUserOpportunitesListQuery : IRequest<PaginatedList<OpportuniteDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SortBy { get; set; } = "DateModification";
        public string SortDirection { get; set; } = "desc";
        public Guid UserId { get; set; }
    }
}
