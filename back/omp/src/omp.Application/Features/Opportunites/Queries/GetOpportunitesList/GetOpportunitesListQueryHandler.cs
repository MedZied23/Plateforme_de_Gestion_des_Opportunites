using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.Opportunites.DTOs;
using System.Linq.Dynamic.Core;

namespace omp.Application.Features.Opportunites.Queries.GetOpportunitesList
{
    public class GetOpportunitesListQueryHandler : IRequestHandler<GetOpportunitesListQuery, PaginatedList<OpportuniteDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetOpportunitesListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedList<OpportuniteDto>> Handle(GetOpportunitesListQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Opportunites
                .AsNoTracking()
                .Select(o => new OpportuniteDto
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
                    Offre = o.Offre,                    AssocieEnCharge = o.AssocieEnCharge,
                    SeniorManagerEnCharge = o.SeniorManagerEnCharge,
                    ManagerEnCharge = o.ManagerEnCharge,
                    CoManagerEnCharge = o.CoManagerEnCharge,
                    EquipeProjet = o.EquipeProjet,
                    IdPropositionFinanciere = o.IdPropositionFinanciere,                    Status = o.Status,
                    LinkTeams1 = o.LinkTeams1,
                    LinkTeams2 = o.LinkTeams2,
                    LinkPropositionFinanciere = o.LinkPropositionFinanciere,
                    
                    // Audit fields
                    DateCreated = o.DateCreated,
                    CreatedBy = o.CreatedBy,
                    LastModified = o.LastModified,
                    LastModifiedBy = o.LastModifiedBy,
                    Commentaire = o.Commentaire
                });            // Temporarily removed sorting to fix DateModification issue
            
            // Create paginated result
            return await Task.FromResult(PaginatedList<OpportuniteDto>.Create(
                query,
                request.PageNumber,
                request.PageSize));
        }
    }
}
