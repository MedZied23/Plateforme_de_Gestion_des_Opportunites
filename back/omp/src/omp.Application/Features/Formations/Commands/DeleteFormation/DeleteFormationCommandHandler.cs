using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Formations.Commands.DeleteFormation
{
    public class DeleteFormationCommandHandler : IRequestHandler<DeleteFormationCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteFormationCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteFormationCommand request, CancellationToken cancellationToken)
        {
            var formation = await _context.Formations
                .FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);

            if (formation == null)
            {
                return false;
            }

            _context.Formations.Remove(formation);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}