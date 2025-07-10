using MediatR;

namespace omp.Application.Features.Clients.Commands.CreateClient
{
    public class CreateClientCommand : IRequest<Guid>
    {
        public string? NomClient { get; set; }
        public string? ContactNom { get; set; }
        public string? Pays { get; set; }
        public string? Type { get; set; }
        public string? Adresse { get; set; }
        public string? Telephone { get; set; }
    }
}
