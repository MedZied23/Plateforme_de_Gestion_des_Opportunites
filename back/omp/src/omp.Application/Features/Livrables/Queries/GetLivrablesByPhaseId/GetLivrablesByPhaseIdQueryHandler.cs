using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Features.Livrables.DTOs;
using omp.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Livrables.Queries.GetLivrablesByPhaseId
{
    public class GetLivrablesByPhaseIdQueryHandler : IRequestHandler<GetLivrablesByPhaseIdQuery, List<LivrableDto>>
    {
        private readonly IApplicationDbContext _dbContext;

        public GetLivrablesByPhaseIdQueryHandler(IApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<LivrableDto>> Handle(GetLivrablesByPhaseIdQuery request, CancellationToken cancellationToken)
        {
            return await _dbContext.Livrables
                .Where(l => l.IdPhase == request.PhaseId)
                .OrderBy(l => l.Numero) // Order by livrable number
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