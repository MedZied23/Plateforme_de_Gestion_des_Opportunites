using MediatR;

namespace omp.Application.Features.Profils.Commands.DeleteProfil
{
    public class DeleteProfilCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}