using System;
using System.Collections.Generic;
using omp.Domain.Entites;

namespace omp.Application.Features.Cvs.DTOs
{
    public class CvDto
    {
        public Guid Id { get; set; }
        public Guid? Id_user { get; set; }
        public string? Presentation { get; set; }
        public string? documentUrl { get; set; }
        public List<Guid>? Formations { get; set; } = new List<Guid>();
        public Dictionary<string, NiveauLangue>? LanguesPratiquees { get; set; } = new Dictionary<string, NiveauLangue>();
        public List<Guid>? Experiences { get; set; } = new List<Guid>();
        public List<string>? Certifications { get; set; } = new List<string>();
        public List<Guid>? Projets { get; set; } = new List<Guid>();
        public DateTime? LastModified { get; set; }
        public DateTime? LastAccessed { get; set; }
    }
}