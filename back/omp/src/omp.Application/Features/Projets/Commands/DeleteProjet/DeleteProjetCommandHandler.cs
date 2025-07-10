using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Projets.Commands.DeleteProjet
{
    public class DeleteProjetCommandHandler : IRequestHandler<DeleteProjetCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteProjetCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteProjetCommand request, CancellationToken cancellationToken)
        {
            var projet = await _context.Projets
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (projet == null)
            {
                return false;
            }

            _context.Projets.Remove(projet);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}