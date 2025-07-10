using System;
using MediatR;
using omp.Application.Features.Formations.DTOs;

namespace omp.Application.Features.Formations.Queries.GetFormationById
{
    public class GetFormationByIdQuery : IRequest<FormationDto>
    {
        public Guid Id { get; set; }
    }
}