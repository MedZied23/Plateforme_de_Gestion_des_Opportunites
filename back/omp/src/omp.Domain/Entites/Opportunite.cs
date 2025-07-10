using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace omp.Domain.Entites
{
    public class Opportunite
    {
        public Guid Id { get; set; }
        public string? NomOpportunite { get; set; }
        public Guid? ClientId { get; set; }  // Foreign key
        public bool? PartnerExists { get; set; }
        public List<Guid>? PartenaireId { get; set; } = new();  // Changed to List of Guid
        public string? Description { get; set; }
        public Nature? Nature { get; set; } // AMI, Propale, Pitch
        public string? Pays { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
        public int? Duree { get; set; } // In case dates are not provided
        public bool? BailleurExists { get; set; }  // New field
        public List<Guid>? IdBailleurDeFonds { get; set; } = new();  // Changed to List of Guid
        public Guid? AssocieEnCharge { get; set; }
        public Guid? SeniorManagerEnCharge { get; set; }
        public Guid? ManagerEnCharge { get; set; }
        public Guid? CoManagerEnCharge { get; set; }
        public List<Guid>? EquipeProjet { get; set; } = new();
        public string? Monnaie { get; set; }
        public string? Offre { get; set; } // e-ID, TMT, GPS, etc.
        public Guid? IdPropositionFinanciere { get; set; } // Foreign key to PropositionFinanciere - made nullable
        public Status? Status { get; set; }
        public string? LinkTeams1 { get; set; }
        public string? LinkTeams2 { get; set; }
        public string? LinkPropositionFinanciere { get; set; }
        public DateTime DateCreated { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? LastModified { get; set; }
        public Guid? LastModifiedBy { get; set; }
        public string? Commentaire { get; set; }
    }
}
