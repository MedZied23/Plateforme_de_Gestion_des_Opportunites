using System;
using MediatR;

namespace omp.Application.Features.Formations.Commands.UpdateFormation
{    public class UpdateFormationCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public Guid CvId { get; set; }
        public string? Diplome { get; set; }
        public string? Institution { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
    }
}