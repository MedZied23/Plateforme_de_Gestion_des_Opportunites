using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class OpportuniteConfiguration : IEntityTypeConfiguration<Opportunite>
    {
        public void Configure(EntityTypeBuilder<Opportunite> builder)
        {
            builder.HasKey(o => o.Id);            builder.Property(o => o.NomOpportunite)
                .HasMaxLength(200);

            builder.Property(o => o.Description)
                .HasMaxLength(1000);            builder.Property(o => o.Nature)
                .HasConversion<string>();

            builder.Property(o => o.Status)
                .HasConversion<string>();

            builder.Property(o => o.Pays)
                .HasMaxLength(100);

            builder.Property(o => o.Monnaie)
                .HasMaxLength(50);

            builder.Property(o => o.Offre)
                .HasMaxLength(100);            builder.Property(o => o.LinkTeams1)
                .HasMaxLength(500);            builder.Property(o => o.LinkTeams2)
                .HasMaxLength(500);
                
            builder.Property(o => o.LinkPropositionFinanciere)
                .HasMaxLength(500);
                
            builder.Property(o => o.Commentaire)
                .HasMaxLength(2000);

            // Update to use new ToTable syntax
            builder.ToTable(tb => 
            {
                tb.HasCheckConstraint("CK_Opportunite_Duree", "\"Duree\" IS NULL OR \"Duree\" >= 0");
                tb.HasCheckConstraint("CK_Opportunite_PartnerExists", 
                    "\"PartnerExists\" IS NULL OR \"PartnerExists\" = false OR (\"PartnerExists\" = true AND \"PartenaireId\" IS NOT NULL)");
            });
        }
    }
}
