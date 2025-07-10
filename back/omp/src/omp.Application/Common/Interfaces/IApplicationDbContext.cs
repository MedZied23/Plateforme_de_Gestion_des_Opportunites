using Microsoft.EntityFrameworkCore;
using omp.Domain.Entites;

namespace omp.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; set; }
        DbSet<Client> Clients { get; set; }
        DbSet<Partenaire> Partenaires { get; set; }
        DbSet<Opportunite> Opportunites { get; set; }
        DbSet<BailleurDeFond> BailleursDeFonds { get; set; }
        DbSet<Livrable> Livrables { get; set; }
        DbSet<Phase> Phases { get; set; }
        DbSet<Profil> Profils { get; set; }
        DbSet<PropositionFinanciere> PropositionsFinancieres { get; set; }
        DbSet<Cv> Cvs { get; set; }
        DbSet<Formation> Formations { get; set; }
        DbSet<Experience> Experiences { get; set; }
        DbSet<Projet> Projets { get; set; }        DbSet<Reference> References { get; set; }        DbSet<CvAuditLog> CvAuditLogs { get; set; }
        DbSet<OpportuniteTask> OpportuniteTasks { get; set; }
        DbSet<Notification> Notifications { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}
