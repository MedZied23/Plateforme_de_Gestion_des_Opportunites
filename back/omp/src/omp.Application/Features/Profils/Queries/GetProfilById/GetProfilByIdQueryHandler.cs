using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Profils.DTOs;

namespace omp.Application.Features.Profils.Queries.GetProfilById
{
    public class GetProfilByIdQueryHandler : IRequestHandler<GetProfilByIdQuery, ProfilDto>
    {
        private readonly IApplicationDbContext _context;

        public GetProfilByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProfilDto> Handle(GetProfilByIdQuery request, CancellationToken cancellationToken)
        {
            return await (from profil in _context.Profils
                         join partenaire in _context.Partenaires on profil.IdPartenaire equals partenaire.Id into partenaireGroup
                         from part in partenaireGroup.DefaultIfEmpty()
                         where profil.Id == request.Id
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
                         .FirstOrDefaultAsync(cancellationToken);
        }
    }
}