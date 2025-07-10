using System;
using MediatR;

namespace omp.Application.Features.Projets.Commands.DeleteProjet
{
    public class DeleteProjetCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}