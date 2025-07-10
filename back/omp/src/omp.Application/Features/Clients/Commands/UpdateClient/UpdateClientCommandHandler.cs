using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Clients.Commands.UpdateClient
{
    public class UpdateClientCommandHandler : IRequestHandler<UpdateClientCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdateClientCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateClientCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Clients.FindAsync(request.Id);

            if (entity == null) return false;

            entity.NomClient = request.NomClient;
            entity.ContactNom = request.ContactNom;
            entity.Pays = request.Pays;
            entity.Type = request.Type;
            entity.Adresse = request.Adresse;
            entity.Telephone = request.Telephone;

            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
}
