using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.ToTable("Notifications");

            builder.HasKey(n => n.Id);

            builder.Property(n => n.Id)
                .ValueGeneratedOnAdd();

            builder.Property(n => n.RecipientIds)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions)null!) ?? new List<Guid>())
                .HasColumnType("jsonb");

            builder.Property(n => n.Title)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(n => n.Body)
                .IsRequired()
                .HasMaxLength(2000);

            builder.Property(n => n.DateSent)
                .IsRequired();

            builder.Property(n => n.Read)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(n => n.DateRead)
                .IsRequired(false);

            builder.Property(n => n.SenderId)
                .IsRequired(false);

            builder.Property(n => n.OpportuniteId)
                .IsRequired(false);            builder.Property(n => n.PropositionFinanciereId)
                .IsRequired(false);

            // Indexes for better query performance
            builder.HasIndex(n => n.SenderId);
            builder.HasIndex(n => n.OpportuniteId);
            builder.HasIndex(n => n.PropositionFinanciereId);
            builder.HasIndex(n => n.DateSent);
            builder.HasIndex(n => n.Read);
        }
    }
}
