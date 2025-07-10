using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace omp.Domain.Entites
{
    public class Cv
    {
        public Guid Id { get; set; }
        public Guid? Id_user { get; set; }
        public string? Presentation { get; set; }
        public string? documentUrl { get; set; }  // URL to the uploaded CV document
        public List<Guid>? Formations { get; set; } = new List<Guid>();
        public Dictionary<string, NiveauLangue>? LanguesPratiquees { get; set; } = new Dictionary<string, NiveauLangue>();
        public List<Guid>? Experiences { get; set; } = new List<Guid>();
        public List<string>? Certifications { get; set; } = new List<string>();
        public List<Guid>? Projets { get; set; } = new List<Guid>();
        public DateTime? LastModified { get; set; }
        public DateTime? LastAccessed { get; set; }
    }
}
