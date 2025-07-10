using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class ReferenceConfiguration : IEntityTypeConfiguration<Reference>
    {
        public void Configure(EntityTypeBuilder<Reference> builder)
        {
            var jsonOptions = new JsonSerializerOptions();
            
            builder.HasKey(r => r.Id);
            
            builder.Property(r => r.Nom)
                .HasMaxLength(200);
                
            builder.Property(r => r.Country)
                .HasMaxLength(100);
                
            // Remove max length constraints for Offre and Description to use PostgreSQL TEXT type
            builder.Property(r => r.Offre)
                .HasColumnType("text");
                
            builder.Property(r => r.Description)
                .HasColumnType("text");
                
            // Configure DocumentUrl property without length restriction
            builder.Property(r => r.DocumentUrl)
                .HasColumnType("text");
            
            // Configure Equipe as JSON string
            builder.Property(r => r.Equipe)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, jsonOptions),
                    v => JsonSerializer.Deserialize<Dictionary<Guid,string>>(v, jsonOptions) ?? new Dictionary<Guid,string>()
                )
                .HasColumnType("text");
                
            // Configure Services complex structure as JSON string
            builder.Property(r => r.Services)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, jsonOptions),
                    v => JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, List<string>>>>(v, jsonOptions) 
                        ?? new Dictionary<string, Dictionary<string, List<string>>>()
                )
                .HasColumnType("text");

            // Add configuration for Client property with no length restriction
            builder.Property(r => r.Client)
                .HasColumnType("text");
        }
    }
}