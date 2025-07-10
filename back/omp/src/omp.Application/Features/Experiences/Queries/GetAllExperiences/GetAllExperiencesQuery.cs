using System.Collections.Generic;
using MediatR;
using omp.Application.Features.Experiences.DTOs;

namespace omp.Application.Features.Experiences.Queries.GetAllExperiences
{
    public class GetAllExperiencesQuery : IRequest<List<ExperienceDto>>
    {
    }
}