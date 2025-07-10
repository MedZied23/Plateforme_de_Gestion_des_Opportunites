using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.Opportunites.DTOs;
using omp.Domain.Entites;
using System.Linq.Dynamic.Core;

namespace omp.Application.Features.Opportunites.Queries.GetUserOpportunitesList
{
    public class GetUserOpportunitesListQueryHandler : IRequestHandler<GetUserOpportunitesListQuery, PaginatedList<OpportuniteDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetUserOpportunitesListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }        public async Task<PaginatedList<OpportuniteDto>> Handle(GetUserOpportunitesListQuery request, CancellationToken cancellationToken)
        {
            // Get the user to check their role
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return PaginatedList<OpportuniteDto>.Create(
                    Enumerable.Empty<OpportuniteDto>().AsQueryable(),
                    request.PageNumber,
                    request.PageSize);
            }

            // First get opportunities where user is in one of the charge roles (this can be translated to SQL)
            var chargeQuery = _context.Opportunites.AsNoTracking()
                .Where(o => 
                    o.AssocieEnCharge == request.UserId ||
                    o.SeniorManagerEnCharge == request.UserId ||
                    o.ManagerEnCharge == request.UserId ||
                    o.CoManagerEnCharge == request.UserId
                );

            // Get all opportunities and filter client-side for team membership
            // This is necessary because EF Core can't translate Contains on JSON arrays
            var allOpportunites = await _context.Opportunites.AsNoTracking().ToListAsync(cancellationToken);
            
            // Filter opportunities where user is in team or in charge roles
            var filteredOpportunites = allOpportunites.Where(o =>
                // User is in one of the charge roles
                o.AssocieEnCharge == request.UserId ||
                o.SeniorManagerEnCharge == request.UserId ||
                o.ManagerEnCharge == request.UserId ||
                o.CoManagerEnCharge == request.UserId ||
                // User is in équipe projet
                (o.EquipeProjet != null && o.EquipeProjet.Contains(request.UserId))
            ).ToList();

            // Map to DTOs
            var opportuniteDtos = filteredOpportunites.Select(o => new OpportuniteDto
            {
                Id = o.Id,
                NomOpportunite = o.NomOpportunite,
                ClientId = o.ClientId,
                PartnerExists = o.PartnerExists,
                PartenaireId = o.PartenaireId,
                Description = o.Description,
                Nature = o.Nature,
                Pays = o.Pays,
                DateDebut = o.DateDebut,
                DateFin = o.DateFin,
                Duree = o.Duree,
                BailleurExists = o.BailleurExists,
                IdBailleurDeFonds = o.IdBailleurDeFonds,
                Monnaie = o.Monnaie,
                Offre = o.Offre,
                AssocieEnCharge = o.AssocieEnCharge,
                SeniorManagerEnCharge = o.SeniorManagerEnCharge,
                ManagerEnCharge = o.ManagerEnCharge,
                CoManagerEnCharge = o.CoManagerEnCharge,
                EquipeProjet = o.EquipeProjet,
                IdPropositionFinanciere = o.IdPropositionFinanciere,
                Status = o.Status,
                LinkTeams1 = o.LinkTeams1,
                LinkTeams2 = o.LinkTeams2,
                LinkPropositionFinanciere = o.LinkPropositionFinanciere,
                
                // Audit fields
                DateCreated = o.DateCreated,
                CreatedBy = o.CreatedBy,
                LastModified = o.LastModified,
                LastModifiedBy = o.LastModifiedBy,
                Commentaire = o.Commentaire
            }).AsQueryable();

            // Create paginated result
            return PaginatedList<OpportuniteDto>.Create(
                opportuniteDtos,
                request.PageNumber,
                request.PageSize);
        }
    }
}
