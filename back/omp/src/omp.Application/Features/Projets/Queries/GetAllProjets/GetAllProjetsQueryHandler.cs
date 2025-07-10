using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Projets.DTOs;

namespace omp.Application.Features.Projets.Queries.GetAllProjets
{
    public class GetAllProjetsQueryHandler : IRequestHandler<GetAllProjetsQuery, List<ProjetDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllProjetsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProjetDto>> Handle(GetAllProjetsQuery request, CancellationToken cancellationToken)
        {
            var projets = await _context.Projets
                .Select(p => new ProjetDto
                {
                    Id = p.Id,
                    Nom = p.Nom,
                    Year = p.Year,
                    Client = p.Client,
                    Domaine = p.Domaine,
                    Perimetre = p.Perimetre,
                    Role = p.Role,
                    Hide = p.Hide,
                    ReferenceId = p.ReferenceId
                })
                .ToListAsync(cancellationToken);

            return projets;
        }
    }
}