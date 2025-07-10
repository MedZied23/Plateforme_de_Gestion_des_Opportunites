using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasKey(u => u.Id);
            
            builder.Property(u => u.Nom)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(u => u.Prenom)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(u => u.Password)
                .IsRequired();

            builder.Property(u => u.Phone)
                .HasMaxLength(20);            builder.Property(u => u.Role)
                .IsRequired()
                .HasConversion<int>();
        }
    }
}
