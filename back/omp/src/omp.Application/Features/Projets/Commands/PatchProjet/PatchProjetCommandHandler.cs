using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Projets.Commands.PatchProjet
{
    public class PatchProjetCommandHandler : IRequestHandler<PatchProjetCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public PatchProjetCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(PatchProjetCommand request, CancellationToken cancellationToken)
        {
            var projet = await _context.Projets
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (projet == null)
            {
                return false;
            }

            // Only update properties that are not null in the request
            if (request.Nom != null)
                projet.Nom = request.Nom;
            
            if (request.Year.HasValue)
                projet.Year = request.Year;
            
            if (request.Client != null)
                projet.Client = request.Client;
            
            if (request.Domaine != null)
                projet.Domaine = request.Domaine;
            
            if (request.Perimetre != null)
                projet.Perimetre = request.Perimetre;
            
            if (request.Role != null)
                projet.Role = request.Role;
            
            if (request.Hide.HasValue)
                projet.Hide = request.Hide.Value;

            if (request.ReferenceId.HasValue)
                projet.ReferenceId = request.ReferenceId.Value;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
