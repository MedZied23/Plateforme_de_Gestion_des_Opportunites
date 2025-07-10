using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Partenaires.Queries.GetPartenaireById
{
    public class GetPartenaireByIdQueryHandler : IRequestHandler<GetPartenaireByIdQuery, PartenaireDetailDto>
    {
        private readonly IApplicationDbContext _context;

        public GetPartenaireByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PartenaireDetailDto> Handle(GetPartenaireByIdQuery request, CancellationToken cancellationToken)
        {
            return await _context.Partenaires
                .Where(p => p.Id == request.Id)
                .Select(p => new PartenaireDetailDto
                {
                    Id = p.Id,
                    Type = p.Type,
                    Nom = p.Nom,
                    Domaine = p.Domaine,
                    ContactCle = p.ContactCle
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}
