using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Clients.Queries.GetClientsList
{
    public class GetClientsListQueryHandler : IRequestHandler<GetClientsListQuery, List<ClientDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetClientsListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ClientDto>> Handle(GetClientsListQuery request, CancellationToken cancellationToken)
        {
            return await _context.Clients
                .Select(c => new ClientDto
                {
                    Id = c.Id,
                    NomClient = c.NomClient,
                    ContactNom = c.ContactNom,
                    Pays = c.Pays,
                    Type = c.Type,
                    Adresse = c.Adresse,
                    Telephone = c.Telephone
                })
                .ToListAsync(cancellationToken);
        }
    }
}
