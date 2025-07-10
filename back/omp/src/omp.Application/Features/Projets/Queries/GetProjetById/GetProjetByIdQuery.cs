using System;
using MediatR;
using omp.Application.Features.Projets.DTOs;

namespace omp.Application.Features.Projets.Queries.GetProjetById
{
    public class GetProjetByIdQuery : IRequest<ProjetDto>
    {
        public Guid Id { get; set; }
    }
}