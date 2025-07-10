using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Cvs.DTOs;
using omp.Domain.Entites;

namespace omp.Application.Features.Cvs.Queries.GetCvById
{
    public class GetCvByIdQueryHandler : IRequestHandler<GetCvByIdQuery, CvDto>
    {
        private readonly IApplicationDbContext _context;

        public GetCvByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CvDto> Handle(GetCvByIdQuery request, CancellationToken cancellationToken)
        {
            var cv = await _context.Cvs
                .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);            if (cv == null)
            {
                return null;
            }

            // Update LastAccessed time when CV is retrieved
            cv.LastAccessed = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

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
                Projets = cv.Projets,
                LastModified = cv.LastModified,
                LastAccessed = cv.LastAccessed
            };
        }
    }
}