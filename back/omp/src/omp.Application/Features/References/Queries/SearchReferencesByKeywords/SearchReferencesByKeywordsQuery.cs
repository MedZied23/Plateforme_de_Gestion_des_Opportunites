using System;
using System.Collections.Generic;
using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.References.DTOs;

namespace omp.Application.Features.References.Queries.SearchReferencesByKeywords
{
    public class SearchReferencesByKeywordsQuery : IRequest<PaginatedList<ReferenceSearchResultDto>>
    {
        public string Keywords { get; set; } = string.Empty;
        
        /// <summary>
        /// Enable fuzzy search mode (default: true)
        /// </summary>
        public bool UseFuzzySearch { get; set; } = true;
        
        /// <summary>
        /// Minimum similarity score (0-100) required for a fuzzy match (default: 70)
        /// </summary>
        public int MinimumSimilarityScore { get; set; } = 70;
        
        /// <summary>
        /// Filter by exact Offre match (optional)
        /// </summary>
        public string? Offre { get; set; }
        
        /// <summary>
        /// Filter by exact Country match (optional)
        /// </summary>
        public string? Country { get; set; }
        
        /// <summary>
        /// Filter by start date range - minimum date (optional)
        /// </summary>
        public DateTime? DateDebutMin { get; set; }
        
        /// <summary>
        /// Filter by start date range - maximum date (optional)
        /// </summary>
        public DateTime? DateDebutMax { get; set; }
        
        /// <summary>
        /// Filter by end date range - minimum date (optional)
        /// </summary>
        public DateTime? DateFinMin { get; set; }
        
        /// <summary>
        /// Filter by end date range - maximum date (optional)
        /// </summary>
        public DateTime? DateFinMax { get; set; }
        
        /// <summary>
        /// Filter by minimum budget (optional)
        /// </summary>
        public long? BudgetMin { get; set; }
        
        /// <summary>
        /// Filter by maximum budget (optional)
        /// </summary>
        public long? BudgetMax { get; set; }
        
        /// <summary>
        /// Page number for pagination (default: 1)
        /// </summary>
        public int PageNumber { get; set; } = 1;
        
        /// <summary>
        /// Page size for pagination (default: 6)
        /// </summary>
        public int PageSize { get; set; } = 6;
    }
}