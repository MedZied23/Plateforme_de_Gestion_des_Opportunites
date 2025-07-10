using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class FormationConfiguration : IEntityTypeConfiguration<Formation>
    {
        public void Configure(EntityTypeBuilder<Formation> builder)
        {
            builder.HasKey(f => f.Id);
            
            builder.Property(f => f.Diplome)
                .HasMaxLength(200);
                
            builder.Property(f => f.Institution)
                .HasMaxLength(200);
                
            builder.Property(f => f.DateDebut)
                .IsRequired(false);
                
            builder.Property(f => f.DateFin)
                .IsRequired(false);
        }
    }
}