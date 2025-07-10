using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using System.Reflection;
using System.Text.Json;

namespace omp.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Client> Clients { get; set; } = null!;
        public DbSet<Partenaire> Partenaires { get; set; } = null!;
        public DbSet<Opportunite> Opportunites { get; set; } = null!;
        public DbSet<BailleurDeFond> BailleursDeFonds { get; set; } = null!;
        public DbSet<Livrable> Livrables { get; set; } = null!;
        public DbSet<Phase> Phases { get; set; } = null!;
        public DbSet<Profil> Profils { get; set; } = null!;
        public DbSet<PropositionFinanciere> PropositionsFinancieres { get; set; } = null!;
        public DbSet<Cv> Cvs { get; set; } = null!;
        public DbSet<Formation> Formations { get; set; } = null!;
        public DbSet<Experience> Experiences { get; set; } = null!;
        public DbSet<Projet> Projets { get; set; } = null!;        public DbSet<Reference> References { get; set; } = null!;        public DbSet<CvAuditLog> CvAuditLogs { get; set; } = null!;
        public DbSet<OpportuniteTask> OpportuniteTasks { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await base.SaveChangesAsync(cancellationToken);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            // Client - Opportunite relationship (One-to-Many)
            modelBuilder.Entity<Opportunite>()
                .HasOne<Client>()
                .WithMany()
                .HasForeignKey(o => o.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PartenaireId as JSON string
            modelBuilder.Entity<Opportunite>()
                .Property(o => o.PartenaireId)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );

            // Configure IdBailleurDeFonds as JSON string
            modelBuilder.Entity<Opportunite>()
                .Property(o => o.IdBailleurDeFonds)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                
            // Configure EquipeProjet as JSON string
            modelBuilder.Entity<Opportunite>()
                .Property(e => e.EquipeProjet)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                
            // Opportunite - PropositionFinanciere relationship (One-to-One)
            modelBuilder.Entity<Opportunite>()
                .HasOne<PropositionFinanciere>()
                .WithOne()
                .HasForeignKey<Opportunite>(o => o.IdPropositionFinanciere)
                .IsRequired(false)  // Explicitly mark as nullable
                .OnDelete(DeleteBehavior.SetNull);
                
            // Profil - Partenaire relationship (Many-to-One)
            modelBuilder.Entity<Profil>()
                .HasOne<Partenaire>()
                .WithMany()
                .HasForeignKey(p => p.IdPartenaire)
                .IsRequired(false)  // This should allow NULL values
                .OnDelete(DeleteBehavior.SetNull);
            
            // Configure foreign key constraint explicitly
            modelBuilder.Entity<Profil>()
                .Property(p => p.IdPartenaire)
                .IsRequired(false);
            
            // Profil - PropositionFinanciere relationship (Many-to-One)
            modelBuilder.Entity<Profil>()
                .HasOne<PropositionFinanciere>()
                .WithMany()
                .HasForeignKey(p => p.IdPropositionFinanciere)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Phase - Livrable relationship (One-to-Many)
            modelBuilder.Entity<Livrable>()
                .HasOne<Phase>()
                .WithMany()
                .HasForeignKey(l => l.IdPhase)
                .OnDelete(DeleteBehavior.Cascade);            // Configure Cv entity relationships
            // When a user is deleted, their CV should also be deleted (cascade)
            modelBuilder.Entity<Cv>()
                .HasOne<User>()
                .WithOne()
                .HasForeignKey<Cv>(c => c.Id_user)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Formations in Cv as JSON string
            modelBuilder.Entity<Cv>()
                .Property(c => c.Formations)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                
            // Add cascade delete for Formation when CV is deleted
            modelBuilder.Entity<Formation>()
                .HasOne<Cv>()
                .WithMany()
                .HasForeignKey("CvId")  // Shadow property for relationship
                .OnDelete(DeleteBehavior.Cascade);

            // Configure LanguesPratiquees in Cv as JSON string
            modelBuilder.Entity<Cv>()
                .Property(c => c.LanguesPratiquees)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<string, NiveauLangue>>(v, JsonSerializerOptions.Default) ?? new Dictionary<string, NiveauLangue>()
                );

            // Configure Experiences in Cv as JSON string
            modelBuilder.Entity<Cv>()
                .Property(c => c.Experiences)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                
            // Add cascade delete for Experience when CV is deleted
            modelBuilder.Entity<Experience>()
                .HasOne<Cv>()
                .WithMany()
                .HasForeignKey("CvId")  // Shadow property for relationship
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Certifications in Cv as JSON string
            modelBuilder.Entity<Cv>()
                .Property(c => c.Certifications)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new List<string>()
                );

            // Configure Projets in Cv as JSON string
            modelBuilder.Entity<Cv>()
                .Property(c => c.Projets)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
                );
                
            // Add cascade delete for Projet when CV is deleted
            modelBuilder.Entity<Projet>()
                .HasOne<Cv>()
                .WithMany()
                .HasForeignKey("CvId")  // Shadow property for relationship
                .OnDelete(DeleteBehavior.Cascade);

            // Configure complex Perimetre property in Projet as JSON string
            modelBuilder.Entity<Projet>()
                .Property(p => p.Perimetre)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<string, List<string>>>(v, JsonSerializerOptions.Default) ?? new Dictionary<string, List<string>>()
                );
        }
    }
}
