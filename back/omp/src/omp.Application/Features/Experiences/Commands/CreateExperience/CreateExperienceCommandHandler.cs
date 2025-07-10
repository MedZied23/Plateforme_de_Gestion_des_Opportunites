using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.Experiences.Commands.CreateExperience
{
    public class CreateExperienceCommandHandler : IRequestHandler<CreateExperienceCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateExperienceCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateExperienceCommand request, CancellationToken cancellationToken)
        {
            var experience = new Experience
            {
                Id = Guid.NewGuid(),
                CvId = request.CvId,
                Employer = request.Employer,
                Poste = request.Poste,
                DateDebut = request.DateDebut.HasValue ? DateTime.SpecifyKind(request.DateDebut.Value, DateTimeKind.Utc) : null,
                DateFin = request.DateFin.HasValue ? DateTime.SpecifyKind(request.DateFin.Value, DateTimeKind.Utc) : null
            };

            await _context.Experiences.AddAsync(experience, cancellationToken);
            
            // If this experience is associated with a CV, add it to the CV's Experiences list
            if (request.CvId.HasValue)
            {
                var cv = await _context.Cvs.FindAsync(request.CvId.Value);
                if (cv != null)
                {
                    cv.Experiences ??= new List<Guid>();
                    cv.Experiences.Add(experience.Id);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            return experience.Id;
        }
    }
}