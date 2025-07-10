using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.Formations.Commands.CreateFormation
{
    public class CreateFormationCommandHandler : IRequestHandler<CreateFormationCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateFormationCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }        public async Task<Guid> Handle(CreateFormationCommand request, CancellationToken cancellationToken)
        {
            var formation = new Formation
            {
                Id = Guid.NewGuid(),
                CvId = request.CvId,
                Diplome = request.Diplome,
                Institution = request.Institution,
                DateDebut = request.DateDebut.HasValue ? DateTime.SpecifyKind(request.DateDebut.Value, DateTimeKind.Utc) : null,
                DateFin = request.DateFin.HasValue ? DateTime.SpecifyKind(request.DateFin.Value, DateTimeKind.Utc) : null
            };            await _context.Formations.AddAsync(formation, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return formation.Id;
        }
    }
}