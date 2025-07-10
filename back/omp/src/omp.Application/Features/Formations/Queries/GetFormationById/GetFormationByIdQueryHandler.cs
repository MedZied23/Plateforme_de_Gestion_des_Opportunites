using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Formations.DTOs;

namespace omp.Application.Features.Formations.Queries.GetFormationById
{
    public class GetFormationByIdQueryHandler : IRequestHandler<GetFormationByIdQuery, FormationDto>
    {
        private readonly IApplicationDbContext _context;

        public GetFormationByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<FormationDto> Handle(GetFormationByIdQuery request, CancellationToken cancellationToken)
        {
            var formation = await _context.Formations
                .FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);

            if (formation == null)
            {
                return null;
            }

            return new FormationDto
            {
                Id = formation.Id,
                Diplome = formation.Diplome,
                Institution = formation.Institution,
                DateDebut = formation.DateDebut,
                DateFin = formation.DateFin
            };
        }
    }
}