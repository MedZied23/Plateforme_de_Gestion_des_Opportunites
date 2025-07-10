using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.Projets.Commands.CreateProjet
{
    public class CreateProjetCommandHandler : IRequestHandler<CreateProjetCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateProjetCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateProjetCommand request, CancellationToken cancellationToken)
        {            var projet = new Projet
            {
                Id = Guid.NewGuid(),
                CvId = request.CvId,
                Nom = request.Nom,
                Year = request.Year,
                Client = request.Client,
                Domaine = request.Domaine,
                Perimetre = request.Perimetre,
                Role = request.Role,
                Hide = request.Hide,
                ReferenceId = request.ReferenceId
            };

            await _context.Projets.AddAsync(projet, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return projet.Id;
        }
    }
}