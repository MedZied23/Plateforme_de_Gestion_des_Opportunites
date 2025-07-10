using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Projets.Commands.UpdateProjet
{
    public class UpdateProjetCommandHandler : IRequestHandler<UpdateProjetCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdateProjetCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateProjetCommand request, CancellationToken cancellationToken)
        {
            var projet = await _context.Projets
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (projet == null)
            {
                return false;
            }            
            projet.Nom = request.Nom;
            projet.Year = request.Year;
            projet.Client = request.Client;
            projet.Domaine = request.Domaine;
            projet.Perimetre = request.Perimetre;
            projet.Role = request.Role;
            projet.Hide = request.Hide;
            projet.ReferenceId = request.ReferenceId;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}