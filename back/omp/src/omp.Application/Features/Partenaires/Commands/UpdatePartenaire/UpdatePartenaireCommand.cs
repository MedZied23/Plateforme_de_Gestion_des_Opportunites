using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.Partenaires.Commands.UpdatePartenaire
{
    public class UpdatePartenaireCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public string? Nom { get; set; }
        public TypePartenaire? Type { get; set; }
        public string? Domaine { get; set; }
        public string? ContactCle { get; set; }
    }
}
