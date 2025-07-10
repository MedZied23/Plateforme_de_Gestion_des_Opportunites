using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Partenaires.Queries.GetPartenairesList
{
    public class GetPartenairesListQueryHandler : IRequestHandler<GetPartenairesListQuery, List<PartenaireDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetPartenairesListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<PartenaireDto>> Handle(GetPartenairesListQuery request, CancellationToken cancellationToken)
        {
            return await _context.Partenaires
                .Select(p => new PartenaireDto
                {
                    Id = p.Id,
                    Nom = p.Nom,
                    Type = p.Type,
                    Domaine = p.Domaine,
                    ContactCle = p.ContactCle
                })
                .ToListAsync(cancellationToken);
        }
    }
}
