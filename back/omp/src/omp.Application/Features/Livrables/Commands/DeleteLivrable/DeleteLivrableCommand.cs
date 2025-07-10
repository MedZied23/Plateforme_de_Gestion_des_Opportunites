using MediatR;
using System;

namespace omp.Application.Features.Livrables.Commands.DeleteLivrable
{
    public class DeleteLivrableCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}