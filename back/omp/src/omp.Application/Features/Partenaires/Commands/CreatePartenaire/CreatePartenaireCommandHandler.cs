using MediatR;
using omp.Domain.Entites;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Partenaires.Commands.CreatePartenaire
{
    public class CreatePartenaireCommandHandler : IRequestHandler<CreatePartenaireCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreatePartenaireCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreatePartenaireCommand request, CancellationToken cancellationToken)
        {
            var entity = new Partenaire
            {
                Id = Guid.NewGuid(),
                Type = request.Type,
                Nom = request.Nom,
                Domaine = request.Domaine,
                ContactCle = request.ContactCle
            };

            _context.Partenaires.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}
