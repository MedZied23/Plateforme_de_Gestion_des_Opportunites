using MediatR;

namespace omp.Application.Features.Clients.Queries.GetClientsList
{
    public class GetClientsListQuery : IRequest<List<ClientDto>>
    {
    }

    public class ClientDto
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
