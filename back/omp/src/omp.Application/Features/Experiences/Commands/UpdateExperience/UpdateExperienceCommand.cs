using System;
using MediatR;

namespace omp.Application.Features.Experiences.Commands.UpdateExperience
{
    public class UpdateExperienceCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public Guid? CvId { get; set; }
        public string? Employer { get; set; }
        public string? Poste { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
    }
}