using System;
using System.Collections.Generic;
using omp.Domain.Entites;

namespace omp.Application.Features.Opportunites.DTOs
{    public class OpportuniteDto
    {
        public Guid Id { get; set; }
        public string? NomOpportunite { get; set; }
        public Guid? ClientId { get; set; }
        public bool? PartnerExists { get; set; }
        public List<Guid>? PartenaireId { get; set; } = new();        public string? Description { get; set; }
        public Nature? Nature { get; set; }
        public string? Pays { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
        public int? Duree { get; set; }
        public bool? BailleurExists { get; set; }
        public List<Guid>? IdBailleurDeFonds { get; set; } = new();
        public string? Monnaie { get; set; }        public string? Offre { get; set; }        public Guid? AssocieEnCharge { get; set; }
        public Guid? SeniorManagerEnCharge { get; set; }
        public Guid? ManagerEnCharge { get; set; }
        public Guid? CoManagerEnCharge { get; set; }
        public List<Guid>? EquipeProjet { get; set; } = new();
        public Guid? IdPropositionFinanciere { get; set; }
        public Status? Status { get; set; }
        public string? LinkTeams1 { get; set; }
        public string? LinkTeams2 { get; set; }
        public string? LinkPropositionFinanciere { get; set; }

        // Audit fields
        public DateTime DateCreated { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? LastModified { get; set; }
        public Guid? LastModifiedBy { get; set; }
        public string? Commentaire { get; set; }
    }
}