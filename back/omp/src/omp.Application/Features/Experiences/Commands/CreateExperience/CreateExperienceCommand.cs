using System;
using MediatR;

namespace omp.Application.Features.Experiences.Commands.CreateExperience
{
    public class CreateExperienceCommand : IRequest<Guid>
    {
        public Guid? CvId { get; set; }
        public string? Employer { get; set; }
        public string? Poste { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
    }
}