using System;
using System.Collections.Generic;

namespace omp.Application.Features.References.DTOs
{
    public class ReferenceDto
    {
        public Guid Id { get; set; }
        public string? Nom { get; set; }
        public string? Country { get; set; }
        public string? Offre { get; set; }
        public string? Client { get; set; }
        public long? Budget { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
        public Dictionary<Guid,string>? Equipe { get; set; } = new Dictionary<Guid,string>();
        public string? Description { get; set; }
        public Dictionary<string, Dictionary<string, List<string>>>? Services { get; set; } = new Dictionary<string, Dictionary<string, List<string>>>();
        public string? DocumentUrl { get; set; }
        public DateTime? LastModified { get; set; }
        public DateTime? LastAccessed { get; set; }
    }
}