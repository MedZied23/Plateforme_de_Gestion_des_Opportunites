using System;
using System.Collections.Generic;
using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.Cvs.DTOs;

namespace omp.Application.Features.Cvs.Queries.SearchCvsByProjectKeywords
{
    public class SearchCvsByProjectKeywordsQuery : IRequest<PaginatedList<CvSearchResultDto>>
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
        /// The page number for pagination (default: 1)
        /// </summary>
        public int PageNumber { get; set; } = 1;
        
        /// <summary>
        /// The page size for pagination (default: 6)
        /// </summary>
        public int PageSize { get; set; } = 6;
    }
}