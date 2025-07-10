using System;
using MediatR;
using omp.Application.Features.Experiences.DTOs;

namespace omp.Application.Features.Experiences.Queries.GetExperienceById
{
    public class GetExperienceByIdQuery : IRequest<ExperienceDto>
    {
        public Guid Id { get; set; }
    }
}