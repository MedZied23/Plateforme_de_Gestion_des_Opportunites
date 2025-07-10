using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.Cvs.Commands.CreateEmptyCv
{
    public class CreateEmptyCvCommandHandler : IRequestHandler<CreateEmptyCvCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateEmptyCvCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateEmptyCvCommand request, CancellationToken cancellationToken)
        {
            // Create a new CV with minimal information
            // This will be used as a placeholder for document uploads
            var cv = new Cv
            {
                Id = Guid.NewGuid(),
                Presentation = "CV created for document upload",
                documentUrl = null, // Initialize the document URL as null
                Formations = new System.Collections.Generic.List<Guid>(),
                LanguesPratiquees = new System.Collections.Generic.Dictionary<string, NiveauLangue>(),
                Experiences = new System.Collections.Generic.List<Guid>(),
                Certifications = new System.Collections.Generic.List<string>(),
                Projets = new System.Collections.Generic.List<Guid>()
            };

            await _context.Cvs.AddAsync(cv, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return cv.Id;
        }
    }
}