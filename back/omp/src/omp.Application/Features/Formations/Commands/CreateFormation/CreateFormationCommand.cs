using System;
using MediatR;

namespace omp.Application.Features.Formations.Commands.CreateFormation
{
    public class CreateFormationCommand : IRequest<Guid>
    {
        public Guid? CvId { get; set; }
        public string? Diplome { get; set; }
        public string? Institution { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
    }
}