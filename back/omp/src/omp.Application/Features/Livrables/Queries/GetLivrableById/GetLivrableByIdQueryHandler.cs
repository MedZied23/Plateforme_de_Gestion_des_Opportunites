using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Livrables.DTOs;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Livrables.Queries.GetLivrableById
{
    public class GetLivrableByIdQueryHandler : IRequestHandler<GetLivrableByIdQuery, LivrableDto>
    {
        private readonly IApplicationDbContext _context;

        public GetLivrableByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<LivrableDto> Handle(GetLivrableByIdQuery request, CancellationToken cancellationToken)
        {
            return await _context.Livrables
                .Where(l => l.Id == request.Id)
                .Select(l => new LivrableDto
                {
                    Id = l.Id,
                    Nom = l.Nom,
                    Numero = l.Numero,
                    StartWeek = l.StartWeek,
                    EndWeek = l.EndWeek,
                    Duration = l.Duration,
                    TotalParLivrable = l.TotalParLivrable,
                    Pourcentage = l.Pourcentage,
                    IdPhase = l.IdPhase
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}