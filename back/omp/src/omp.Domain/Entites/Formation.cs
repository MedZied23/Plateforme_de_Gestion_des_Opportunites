using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace omp.Domain.Entites
{
    public class Formation
    {
        public Guid Id { get; set; }
        public Guid? CvId { get; set; }
        public string? Diplome { get; set; }
        public string? Institution { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
    }
}
