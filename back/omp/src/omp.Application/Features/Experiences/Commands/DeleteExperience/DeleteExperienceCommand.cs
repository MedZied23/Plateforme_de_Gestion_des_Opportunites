using System;
using MediatR;

namespace omp.Application.Features.Experiences.Commands.DeleteExperience
{
    public class DeleteExperienceCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}