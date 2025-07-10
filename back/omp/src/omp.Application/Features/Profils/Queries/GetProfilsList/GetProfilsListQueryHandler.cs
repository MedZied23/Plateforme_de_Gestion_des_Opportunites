using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Profils.DTOs;

namespace omp.Application.Features.Profils.Queries.GetProfilsList
{
    public class GetProfilsListQueryHandler : IRequestHandler<GetProfilsListQuery, List<ProfilDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetProfilsListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProfilDto>> Handle(GetProfilsListQuery request, CancellationToken cancellationToken)
        {
            return await (from profil in _context.Profils
                         join partenaire in _context.Partenaires on profil.IdPartenaire equals partenaire.Id into partenaireGroup
                         from part in partenaireGroup.DefaultIfEmpty()
                         select new ProfilDto
                         {
                             Id = profil.Id,
                             NomPrenom = profil.NomPrenom,
                             Numero = profil.Numero,
                             Poste = profil.Poste,
                             TJM = profil.TJM,
                             TotalParProfil = profil.TotalParProfil,
                             TotalCostParProfil = profil.TotalCostParProfil,
                             TotalSiege = profil.TotalSiege,
                             TotalTerrain = profil.TotalTerrain,
                             TotalSiegeParJour = profil.TotalSiegeParJour,
                             TotalTerrainParJour = profil.TotalTerrainParJour,
                             UnitsDepense = profil.UnitsDepense,
                             TotalDepense = profil.TotalDepense,
                             IdPartenaire = profil.IdPartenaire ?? Guid.Empty,
                             IdPropositionFinanciere = profil.IdPropositionFinanciere
                         })
                         .ToListAsync(cancellationToken);
        }
    }
}