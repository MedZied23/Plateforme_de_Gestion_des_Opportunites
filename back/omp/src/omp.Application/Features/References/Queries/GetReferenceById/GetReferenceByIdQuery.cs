using System;
using MediatR;
using omp.Application.Features.References.DTOs;

namespace omp.Application.Features.References.Queries.GetReferenceById
{
    public class GetReferenceByIdQuery : IRequest<ReferenceDto>
    {
        public Guid Id { get; set; }
    }
}