using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Formations.Commands.UpdateFormation
{
    public class UpdateFormationCommandHandler : IRequestHandler<UpdateFormationCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdateFormationCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateFormationCommand request, CancellationToken cancellationToken)
        {
            var formation = await _context.Formations
                .FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);

            if (formation == null)
            {
                return false;
            }            formation.CvId = request.CvId;
            formation.Diplome = request.Diplome;
            formation.Institution = request.Institution;
            formation.DateDebut = request.DateDebut.HasValue ? DateTime.SpecifyKind(request.DateDebut.Value, DateTimeKind.Utc) : null;
            formation.DateFin = request.DateFin.HasValue ? DateTime.SpecifyKind(request.DateFin.Value, DateTimeKind.Utc) : null;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}