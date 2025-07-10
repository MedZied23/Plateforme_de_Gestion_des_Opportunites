using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Experiences.DTOs;

namespace omp.Application.Features.Experiences.Queries.GetAllExperiences
{
    public class GetAllExperiencesQueryHandler : IRequestHandler<GetAllExperiencesQuery, List<ExperienceDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllExperiencesQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ExperienceDto>> Handle(GetAllExperiencesQuery request, CancellationToken cancellationToken)
        {
            var experiences = await _context.Experiences
                .Select(e => new ExperienceDto
                {
                    Id = e.Id,
                    Employer = e.Employer,
                    Poste = e.Poste,
                    DateDebut = e.DateDebut,
                    DateFin = e.DateFin
                })
                .ToListAsync(cancellationToken);

            return experiences;
        }
    }
}