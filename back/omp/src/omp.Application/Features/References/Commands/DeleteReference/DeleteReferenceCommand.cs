using System;
using MediatR;

namespace omp.Application.Features.References.Commands.DeleteReference
{
    public class DeleteReferenceCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }
    }
}