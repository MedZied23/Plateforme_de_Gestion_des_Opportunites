using MediatR;
using omp.Domain.Entites;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Clients.Commands.CreateClient
{
    public class CreateClientCommandHandler : IRequestHandler<CreateClientCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateClientCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateClientCommand request, CancellationToken cancellationToken)
        {
            var entity = new Client
            {
                Id = Guid.NewGuid(),
                NomClient = request.NomClient,
                ContactNom = request.ContactNom,
                Pays = request.Pays,
                Type = request.Type,
                Adresse = request.Adresse,
                Telephone = request.Telephone
            };

            _context.Clients.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}
