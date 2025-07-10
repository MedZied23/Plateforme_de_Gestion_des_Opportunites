using MediatR;

namespace omp.Application.Features.Partenaires.Commands.DeletePartenaire
{
    public class DeletePartenaireCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}
