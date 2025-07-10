using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Experiences.Commands.DeleteExperience
{
    public class DeleteExperienceCommandHandler : IRequestHandler<DeleteExperienceCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteExperienceCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteExperienceCommand request, CancellationToken cancellationToken)
        {
            var experience = await _context.Experiences
                .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);

            if (experience == null)
            {
                return false;
            }

            _context.Experiences.Remove(experience);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}