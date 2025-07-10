using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.BailleursDeFond.DTOs;

namespace omp.Application.Features.BailleursDeFond.Queries.GetBailleurDeFondById
{
    public class GetBailleurDeFondByIdQueryHandler : IRequestHandler<GetBailleurDeFondByIdQuery, BailleurDeFondDto>
    {
        private readonly IApplicationDbContext _context;

        public GetBailleurDeFondByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<BailleurDeFondDto> Handle(GetBailleurDeFondByIdQuery request, CancellationToken cancellationToken)
        {
            return await _context.BailleursDeFonds
                .Where(b => b.Id == request.Id)
                .Select(b => new BailleurDeFondDto
                {
                    Id = b.Id,
                    NomBailleur = b.NomBailleur,
                    Modele = b.Modele
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}