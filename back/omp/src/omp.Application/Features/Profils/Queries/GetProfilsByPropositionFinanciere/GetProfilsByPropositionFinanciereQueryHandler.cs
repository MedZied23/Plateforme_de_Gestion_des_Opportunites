using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Profils.DTOs;

namespace omp.Application.Features.Profils.Queries.GetProfilsByPropositionFinanciere
{
    public class GetProfilsByPropositionFinanciereQueryHandler : IRequestHandler<GetProfilsByPropositionFinanciereQuery, List<ProfilDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetProfilsByPropositionFinanciereQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProfilDto>> Handle(GetProfilsByPropositionFinanciereQuery request, CancellationToken cancellationToken)
        {
            var profiles = await _context.Profils
                .Where(p => p.IdPropositionFinanciere == request.PropositionFinanciereId)
                .Select(p => new ProfilDto
                {
                    Id = p.Id,
                    NomPrenom = p.NomPrenom,
                    Numero = p.Numero,
                    Poste = p.Poste,
                    TJM = p.TJM,
                    TotalParProfil = p.TotalParProfil,
                    TotalCostParProfil = p.TotalCostParProfil,
                    TotalSiege = p.TotalSiege,
                    TotalTerrain = p.TotalTerrain,
                    TotalSiegeParJour = p.TotalSiegeParJour,
                    TotalTerrainParJour = p.TotalTerrainParJour,
                    UnitsDepense = p.UnitsDepense,
                    TotalDepense = p.TotalDepense,
                    IdPartenaire = p.IdPartenaire ?? Guid.Empty,
                    IdPropositionFinanciere = p.IdPropositionFinanciere
                })
                .ToListAsync(cancellationToken);

            return profiles;
        }
    }
}