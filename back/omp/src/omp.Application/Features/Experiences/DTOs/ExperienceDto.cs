using System;
using System.Collections.Generic;

namespace omp.Application.Features.Experiences.DTOs
{
    public class ExperienceDto
    {
        public Guid Id { get; set; }
        public Guid? CvId { get; set; }
        public string? Employer { get; set; }
        public string? Poste { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
    }
}