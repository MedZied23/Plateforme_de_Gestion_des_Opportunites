using System;
using System.Collections.Generic;

namespace omp.Application.Features.Formations.DTOs
{    public class FormationDto
    {
        public Guid Id { get; set; }
        public Guid CvId { get; set; }
        public string? Diplome { get; set; }
        public string? Institution { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
    }
}