using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Cvs.Commands.UpdateCv
{
    public class UpdateCvCommandHandler : IRequestHandler<UpdateCvCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdateCvCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateCvCommand request, CancellationToken cancellationToken)
        {
            var cv = await _context.Cvs
                .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

            if (cv == null)
            {
                return false;
            }            cv.Id_user = request.Id_user;
            cv.Presentation = request.Presentation;
            cv.documentUrl = request.documentUrl;
            cv.Formations = request.Formations;
            cv.LanguesPratiquees = request.LanguesPratiquees;
            cv.Experiences = request.Experiences;
            cv.Certifications = request.Certifications;
            cv.Projets = request.Projets;
            cv.LastModified = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}