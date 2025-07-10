using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Formations.DTOs;

namespace omp.Application.Features.Formations.Queries.GetAllFormations
{
    public class GetAllFormationsQueryHandler : IRequestHandler<GetAllFormationsQuery, List<FormationDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllFormationsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<FormationDto>> Handle(GetAllFormationsQuery request, CancellationToken cancellationToken)
        {
            var formations = await _context.Formations
                .Select(f => new FormationDto
                {
                    Id = f.Id,
                    Diplome = f.Diplome,
                    Institution = f.Institution,
                    DateDebut = f.DateDebut,
                    DateFin = f.DateFin
                })
                .ToListAsync(cancellationToken);

            return formations;
        }
    }
}