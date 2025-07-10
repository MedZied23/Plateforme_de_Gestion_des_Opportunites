using System;
using MediatR;

namespace omp.Application.Features.Cvs.Commands.CreateEmptyCv
{
    public class CreateEmptyCvCommand : IRequest<Guid>
    {
        // Empty command - will create a CV with minimal required fields
        // This will be used specifically for document uploads
    }
}