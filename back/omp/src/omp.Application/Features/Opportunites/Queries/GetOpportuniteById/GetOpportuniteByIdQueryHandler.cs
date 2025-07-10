using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Opportunites.DTOs;

namespace omp.Application.Features.Opportunites.Queries.GetOpportuniteById
{
    public class GetOpportuniteByIdQueryHandler : IRequestHandler<GetOpportuniteByIdQuery, OpportuniteDto>
    {
        private readonly IApplicationDbContext _context;

        public GetOpportuniteByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<OpportuniteDto> Handle(GetOpportuniteByIdQuery request, CancellationToken cancellationToken)
        {
            return await _context.Opportunites
                .Where(o => o.Id == request.Id)
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
                    Duree = o.Duree,                    BailleurExists = o.BailleurExists,
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
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}
