using MediatR;
using omp.Application.Features.Livrables.DTOs;
using System;

namespace omp.Application.Features.Livrables.Queries.GetLivrableById
{
    public class GetLivrableByIdQuery : IRequest<LivrableDto>
    {
        public Guid Id { get; set; }
    }
}