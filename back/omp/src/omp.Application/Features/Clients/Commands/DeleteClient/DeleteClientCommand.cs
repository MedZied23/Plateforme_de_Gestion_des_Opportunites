using MediatR;

namespace omp.Application.Features.Clients.Commands.DeleteClient
{
    public class DeleteClientCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}
