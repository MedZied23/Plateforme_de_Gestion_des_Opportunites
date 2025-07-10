using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class CvConfiguration : IEntityTypeConfiguration<Cv>
    {
        public void Configure(EntityTypeBuilder<Cv> builder)
        {
            builder.HasKey(c => c.Id);
            
            builder.Property(c => c.Presentation)
                .HasMaxLength(2000);
                
            builder.Property(c => c.Id_user)
                .IsRequired(false);
                
            // Configure complex type conversions through JSON serialization
            builder.Property(c => c.Formations)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                
            builder.Property(c => c.LanguesPratiquees)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<string, NiveauLangue>>(v, JsonSerializerOptions.Default) ?? new Dictionary<string, NiveauLangue>()
                );
                
            builder.Property(c => c.Experiences)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                
            builder.Property(c => c.Certifications)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new List<string>()
                );
                
            builder.Property(c => c.Projets)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                  // Define relationship between Cv and User
            // When a user is deleted, their CV should also be deleted (cascade)
            builder.HasOne<User>()
                .WithOne()
                .HasForeignKey<Cv>(c => c.Id_user)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}