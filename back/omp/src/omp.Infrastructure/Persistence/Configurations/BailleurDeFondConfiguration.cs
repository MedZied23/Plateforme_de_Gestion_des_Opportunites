using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class BailleurDeFondConfiguration : IEntityTypeConfiguration<BailleurDeFond>
    {
        public void Configure(EntityTypeBuilder<BailleurDeFond> builder)
        {
            builder.HasKey(b => b.Id);

            builder.Property(b => b.NomBailleur)
                .IsRequired()
                .HasMaxLength(100);

            // Configure Modele as nullable enum
            builder.Property(b => b.Modele)
                .HasConversion<int>();
        }
    }
}