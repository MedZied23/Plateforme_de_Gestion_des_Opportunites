using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Partenaires.Commands.UpdatePartenaire
{
    public class UpdatePartenaireCommandHandler : IRequestHandler<UpdatePartenaireCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdatePartenaireCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdatePartenaireCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Partenaires.FindAsync(request.Id);

            if (entity == null) return false;

            entity.Nom = request.Nom;
            entity.Type = request.Type;
            entity.Domaine = request.Domaine;
            entity.ContactCle = request.ContactCle;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
