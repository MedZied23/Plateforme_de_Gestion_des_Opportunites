using System;
using System.Collections.Generic;
using omp.Domain.Entites;

namespace omp.Application.Features.Cvs.DTOs
{
    public class CvSearchResultDto : CvDto
    {
        /// <summary>
        /// IDs of projects that specifically matched the search criteria
        /// </summary>
        public List<Guid> MatchedProjectIds { get; set; } = new List<Guid>();
    }
}