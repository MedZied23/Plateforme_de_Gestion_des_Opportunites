using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class ProfilConfiguration : IEntityTypeConfiguration<Profil>
    {
        public void Configure(EntityTypeBuilder<Profil> builder)
        {
            builder.HasKey(p => p.Id);

            // Configure complex UnitsDepense property as JSON string
            builder.Property(p => p.UnitsDepense)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<TypeDepense, int>>(v, JsonSerializerOptions.Default) ?? new Dictionary<TypeDepense, int>()
                );

            // Configure the relationship with Partenaire without navigation property
            builder.HasOne(typeof(Partenaire))
                .WithMany()
                .HasForeignKey("IdPartenaire")
                .OnDelete(DeleteBehavior.SetNull); // We'll handle the deletion in the handler

            // Configure the relationship with PropositionFinanciere
            builder.HasOne(typeof(PropositionFinanciere))
                .WithMany()
                .HasForeignKey("IdPropositionFinanciere")
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}