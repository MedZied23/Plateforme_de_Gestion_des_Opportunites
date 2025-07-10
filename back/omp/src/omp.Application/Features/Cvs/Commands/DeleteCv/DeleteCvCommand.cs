using System;
using MediatR;

namespace omp.Application.Features.Cvs.Commands.DeleteCv
{
    public class DeleteCvCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}