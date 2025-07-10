using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class ProjetConfiguration : IEntityTypeConfiguration<Projet>
    {
        public void Configure(EntityTypeBuilder<Projet> builder)
        {
            builder.HasKey(p => p.Id);
            
            // Remove MaxLength constraints to use PostgreSQL TEXT type with no length limit
            builder.Property(p => p.Nom)
                .HasColumnType("text");
                
            builder.Property(p => p.Domaine)
                .HasColumnType("text");
                
            builder.Property(p => p.Role)
                .HasColumnType("text");
            
            // Configure new Client property   
            builder.Property(p => p.Client)
                .HasColumnType("text");
                
            // Configure Year property as nullable integer
            builder.Property(p => p.Year);
                
            // Configure complex Perimetre property as JSON string
            builder.Property(p => p.Perimetre)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<string, List<string>>>(v, JsonSerializerOptions.Default) ?? new Dictionary<string, List<string>>()
                );

            // Configure Reference relationship
            builder.HasOne<Reference>()
                .WithMany()
                .HasForeignKey(p => p.ReferenceId)
                .IsRequired(false)  // Make it optional
                .OnDelete(DeleteBehavior.SetNull);  // Set to null when reference is deleted
        }
    }
}