using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.Cvs.Commands.CreateCv
{
    public class CreateCvCommandHandler : IRequestHandler<CreateCvCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateCvCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateCvCommand request, CancellationToken cancellationToken)
        {            var cv = new Cv
            {
                Id = Guid.NewGuid(),
                Id_user = request.Id_user,
                Presentation = request.Presentation,
                documentUrl = request.documentUrl,
                Formations = request.Formations,
                LanguesPratiquees = request.LanguesPratiquees,
                Experiences = request.Experiences,
                Certifications = request.Certifications,
                Projets = request.Projets,
                LastModified = DateTime.UtcNow,
                LastAccessed = DateTime.UtcNow
            };

            await _context.Cvs.AddAsync(cv, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return cv.Id;
        }
    }
}