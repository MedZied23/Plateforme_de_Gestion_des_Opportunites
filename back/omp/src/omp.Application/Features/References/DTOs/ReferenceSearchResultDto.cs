using System;
using System.Collections.Generic;

namespace omp.Application.Features.References.DTOs
{
    public class ReferenceSearchResultDto : ReferenceDto
    {
        /// <summary>
        /// Keys in the Services dictionary that specifically matched the search criteria
        /// </summary>
        public List<string> MatchedServiceKeys { get; set; } = new List<string>();
        
        /// <summary>
        /// The similarity score for this reference (only used when fuzzy search is enabled)
        /// </summary>
        public int SimilarityScore { get; set; }
    }
}