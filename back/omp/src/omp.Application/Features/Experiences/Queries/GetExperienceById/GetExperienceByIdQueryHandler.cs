using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Experiences.DTOs;

namespace omp.Application.Features.Experiences.Queries.GetExperienceById
{
    public class GetExperienceByIdQueryHandler : IRequestHandler<GetExperienceByIdQuery, ExperienceDto>
    {
        private readonly IApplicationDbContext _context;

        public GetExperienceByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ExperienceDto> Handle(GetExperienceByIdQuery request, CancellationToken cancellationToken)
        {
            var experience = await _context.Experiences
                .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

            if (experience == null)
            {
                return null;
            }

            return new ExperienceDto
            {
                Id = experience.Id,
                Employer = experience.Employer,
                Poste = experience.Poste,
                DateDebut = experience.DateDebut,
                DateFin = experience.DateFin
            };
        }
    }
}