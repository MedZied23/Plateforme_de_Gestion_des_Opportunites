using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.Partenaires.Commands.CreatePartenaire
{
    public class CreatePartenaireCommand : IRequest<Guid>
    {
        public string? Nom { get; set; }
        public TypePartenaire? Type { get; set; }
        public string? Domaine { get; set; }
        public string? ContactCle { get; set; }
    }
}
