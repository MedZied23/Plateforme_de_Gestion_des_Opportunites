using MediatR;

namespace omp.Application.Features.Clients.Queries.GetClientById
{
    public class GetClientByIdQuery : IRequest<ClientDetailDto>
    {
        public Guid Id { get; set; }
    }

    public class ClientDetailDto
    {
        public Guid Id { get; set; }
        public string? NomClient { get; set; }
        public string? ContactNom { get; set; }
        public string? Pays { get; set; }
        public string? Type { get; set; }
        public string? Adresse { get; set; }
        public string? Telephone { get; set; }
    }
}
