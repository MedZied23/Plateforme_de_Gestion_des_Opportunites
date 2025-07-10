using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Clients.Queries.GetClientById
{
    public class GetClientByIdQueryHandler : IRequestHandler<GetClientByIdQuery, ClientDetailDto>
    {
        private readonly IApplicationDbContext _context;

        public GetClientByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

public async Task<ClientDetailDto> Handle(GetClientByIdQuery request, CancellationToken cancellationToken)
{
    var client = await _context.Clients
        .Where(c => c.Id == request.Id)
        .Select(c => new ClientDetailDto
        {
            Id = c.Id,
            NomClient = c.NomClient,
            ContactNom = c.ContactNom,
            Pays = c.Pays,
            Type = c.Type,
            Adresse = c.Adresse,
            Telephone = c.Telephone
        })
        .FirstOrDefaultAsync(cancellationToken);

    return client;
}
    }
}
