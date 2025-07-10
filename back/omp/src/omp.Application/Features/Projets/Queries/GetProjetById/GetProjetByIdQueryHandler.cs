using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Projets.DTOs;

namespace omp.Application.Features.Projets.Queries.GetProjetById
{
    public class GetProjetByIdQueryHandler : IRequestHandler<GetProjetByIdQuery, ProjetDto>
    {
        private readonly IApplicationDbContext _context;

        public GetProjetByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProjetDto> Handle(GetProjetByIdQuery request, CancellationToken cancellationToken)
        {
            var projet = await _context.Projets
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (projet == null)
            {
                return new ProjetDto(); // Return empty DTO instead of null
            }

            return new ProjetDto
            {
                Id = projet.Id,
                Nom = projet.Nom,
                Year = projet.Year,
                Client = projet.Client,
                Domaine = projet.Domaine,
                Perimetre = projet.Perimetre,
                Role = projet.Role,
                Hide = projet.Hide,
                ReferenceId = projet.ReferenceId
            };
        }
    }
}