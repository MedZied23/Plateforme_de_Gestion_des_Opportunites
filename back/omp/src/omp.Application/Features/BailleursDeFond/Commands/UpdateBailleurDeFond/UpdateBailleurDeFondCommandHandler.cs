using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.BailleursDeFond.Commands.UpdateBailleurDeFond
{
    public class UpdateBailleurDeFondCommandHandler : IRequestHandler<UpdateBailleurDeFondCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdateBailleurDeFondCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateBailleurDeFondCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.BailleursDeFonds.FindAsync(request.Id);

            if (entity == null) return false;

            entity.NomBailleur = request.NomBailleur;
            entity.Modele = request.Modele;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}