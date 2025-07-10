using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.Partenaires.Queries.GetPartenairesList
{
    public class GetPartenairesListQuery : IRequest<List<PartenaireDto>>
    {
    }

    public class PartenaireDto
    {
        public Guid Id { get; set; }
        public TypePartenaire? Type { get; set; }
        public string? Nom { get; set; }
        public string? Domaine { get; set; }
        public string? ContactCle { get; set; }
    }
}
