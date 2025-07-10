using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace omp.Domain.Entites
{    public class Projet
    {
        public Guid Id { get; set; }
        public Guid? CvId { get; set; }
        public string? Nom { get; set; }
        public int? Year { get; set; }
        public string? Client { get; set; }
        public string? Domaine { get; set; }
        public Dictionary<string, List<string>>? Perimetre { get; set; }
        public string? Role { get; set; }
        public bool Hide { get; set; } = false;
        
        public Guid? ReferenceId { get; set; }
    }
}
