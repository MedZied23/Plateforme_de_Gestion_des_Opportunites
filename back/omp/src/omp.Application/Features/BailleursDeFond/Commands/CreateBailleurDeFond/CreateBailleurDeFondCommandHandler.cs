using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.BailleursDeFond.Commands.CreateBailleurDeFond
{
    public class CreateBailleurDeFondCommandHandler : IRequestHandler<CreateBailleurDeFondCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateBailleurDeFondCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateBailleurDeFondCommand request, CancellationToken cancellationToken)
        {
            var entity = new BailleurDeFond
            {
                Id = Guid.NewGuid(),
                NomBailleur = request.NomBailleur,
                Modele = request.Modele
            };

            _context.BailleursDeFonds.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}