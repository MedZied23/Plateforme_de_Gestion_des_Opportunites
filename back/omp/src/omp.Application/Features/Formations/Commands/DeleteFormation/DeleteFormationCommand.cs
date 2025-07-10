using System;
using MediatR;

namespace omp.Application.Features.Formations.Commands.DeleteFormation
{
    public class DeleteFormationCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}