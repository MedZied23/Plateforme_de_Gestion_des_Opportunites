using System.Collections.Generic;
using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.References.DTOs;

namespace omp.Application.Features.References.Queries.GetReferencesList
{
    public class GetReferencesListQuery : IRequest<PaginatedList<ReferenceDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 6; // 6 items per page as requested
        public string SortBy { get; set; } = "LastAccessed"; // Default sort by last accessed
        public string SortDirection { get; set; } = "desc"; // Default sort direction (newest first)
    }
}