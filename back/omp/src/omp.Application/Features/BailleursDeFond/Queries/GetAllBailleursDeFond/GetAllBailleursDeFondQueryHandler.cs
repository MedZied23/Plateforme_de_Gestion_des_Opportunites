using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.BailleursDeFond.DTOs;

namespace omp.Application.Features.BailleursDeFond.Queries.GetAllBailleursDeFond
{
    public class GetAllBailleursDeFondQueryHandler : IRequestHandler<GetAllBailleursDeFondQuery, List<BailleurDeFondDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllBailleursDeFondQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<BailleurDeFondDto>> Handle(GetAllBailleursDeFondQuery request, CancellationToken cancellationToken)
        {
            return await _context.BailleursDeFonds
                .Select(b => new BailleurDeFondDto
                {
                    Id = b.Id,
                    NomBailleur = b.NomBailleur,
                    Modele = b.Modele
                })
                .ToListAsync(cancellationToken);
        }
    }
}