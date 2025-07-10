using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class CvAuditLogConfiguration : IEntityTypeConfiguration<CvAuditLog>
    {
        public void Configure(EntityTypeBuilder<CvAuditLog> builder)
        {
            builder.HasKey(cal => cal.Id);

            // Configure the relationship with Cv
            // CvAuditLog has one Cv, and if Cv is deleted, CvAuditLog is also deleted
            builder.HasOne<Cv>()
                .WithMany() // Assuming Cv might have multiple audit logs, though not explicitly defined as a navigation property in Cv
                .HasForeignKey(cal => cal.CvId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            // Configure the relationship with User for ModifiedBy
            // ModifiedBy is a UserId
            builder.HasOne<User>()
                .WithMany() // Assuming a User can modify multiple entities, hence multiple audit logs
                .HasForeignKey(cal => cal.ModifiedBy)
                .IsRequired()
                .OnDelete(DeleteBehavior.NoAction); 

            builder.Property(cal => cal.TypeOperation)
                .IsRequired();

            builder.Property(cal => cal.Element)
                .IsRequired();

            builder.Property(cal => cal.DateModification)
                .IsRequired();
        }
    }
}
