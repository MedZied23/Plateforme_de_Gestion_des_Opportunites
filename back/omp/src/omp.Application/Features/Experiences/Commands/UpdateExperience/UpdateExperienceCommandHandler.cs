using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Experiences.Commands.UpdateExperience
{
    public class UpdateExperienceCommandHandler : IRequestHandler<UpdateExperienceCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdateExperienceCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateExperienceCommand request, CancellationToken cancellationToken)
        {
            var experience = await _context.Experiences
                .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

            if (experience == null)
            {
                return false;
            }            // CvId should not change after creation as experiences belong to a single CV

            experience.CvId = request.CvId;
            experience.Employer = request.Employer;
            experience.Poste = request.Poste;
            experience.DateDebut = request.DateDebut;
            experience.DateFin = request.DateFin;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}