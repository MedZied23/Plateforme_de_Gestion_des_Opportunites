using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.Partenaires.Queries.GetPartenaireById
{
    public class GetPartenaireByIdQuery : IRequest<PartenaireDetailDto>
    {
        public Guid Id { get; set; }
    }

    public class PartenaireDetailDto
    {
        public Guid Id { get; set; }
        public TypePartenaire? Type { get; set; }
        public string? Nom { get; set; }
        public string? Domaine { get; set; }
        public string? ContactCle { get; set; }
    }
}
