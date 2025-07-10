using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class OpportuniteTaskConfiguration : IEntityTypeConfiguration<OpportuniteTask>
    {        public void Configure(EntityTypeBuilder<OpportuniteTask> builder)
        {
            builder.HasKey(t => t.Id);

            // Configure foreign key relationship with cascade delete
            builder.HasOne<Opportunite>()
                .WithMany()
                .HasForeignKey(t => t.OpportuniteId)
                .OnDelete(DeleteBehavior.Cascade);            // Configure Name enum as string
            builder.Property(t => t.Name)
                .HasConversion<string>();

            // Configure Type enum as string
            builder.Property(t => t.Type)
                .HasConversion<string>();

            // Configure Statut enum as string
            builder.Property(t => t.Statut)
                .HasConversion<string>();            // Configure Equipe as JSON
            builder.Property(t => t.Equipe)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<Guid, bool>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<Guid, bool>())
                .HasColumnType("text");

            // Add constraints
            builder.ToTable(tb => 
            {
                tb.HasCheckConstraint("CK_OpportuniteTask_Percentage", 
                    "\"Percentage\" IS NULL OR (\"Percentage\" >= 0 AND \"Percentage\" <= 100)");
                tb.HasCheckConstraint("CK_OpportuniteTask_Numero", 
                    "\"Numero\" IS NULL OR \"Numero\" >= 1");
            });
        }
    }
}
