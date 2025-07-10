using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Livrables.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Livrables.Queries.GetLivrablesList
{
    public class GetLivrablesListQueryHandler : IRequestHandler<GetLivrablesListQuery, List<LivrableDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetLivrablesListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<LivrableDto>> Handle(GetLivrablesListQuery request, CancellationToken cancellationToken)
        {
            return await _context.Livrables
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
                .ToListAsync(cancellationToken);
        }
    }
}