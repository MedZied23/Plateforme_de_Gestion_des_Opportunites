using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class ExperienceConfiguration : IEntityTypeConfiguration<Experience>
    {
        public void Configure(EntityTypeBuilder<Experience> builder)
        {
            builder.HasKey(e => e.Id);
            
            builder.Property(e => e.Employer)
                .HasMaxLength(200);
                
            builder.Property(e => e.Poste)
                .HasMaxLength(200);
                
            builder.Property(e => e.DateDebut)
                .IsRequired(false);
                
            builder.Property(e => e.DateFin)
                .IsRequired(false);
        }
    }
}