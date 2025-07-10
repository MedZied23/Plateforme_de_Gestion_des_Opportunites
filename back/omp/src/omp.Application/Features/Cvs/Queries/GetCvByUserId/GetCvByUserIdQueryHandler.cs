using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Cvs.DTOs;
using omp.Domain.Entites;

namespace omp.Application.Features.Cvs.Queries.GetCvByUserId
{
    public class GetCvByUserIdQueryHandler : IRequestHandler<GetCvByUserIdQuery, CvDto>
    {
        private readonly IApplicationDbContext _context;

        public GetCvByUserIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CvDto> Handle(GetCvByUserIdQuery request, CancellationToken cancellationToken)
        {
            var cv = await _context.Cvs
                .FirstOrDefaultAsync(c => c.Id_user == request.UserId, cancellationToken);

            if (cv == null)
            {
                return null;
            }

            return new CvDto
            {
                Id = cv.Id,
                Id_user = cv.Id_user,
                Presentation = cv.Presentation,
                documentUrl = cv.documentUrl,
                Formations = cv.Formations,
                LanguesPratiquees = cv.LanguesPratiquees,
                Experiences = cv.Experiences,
                Certifications = cv.Certifications,
                Projets = cv.Projets
            };
        }
    }
}
