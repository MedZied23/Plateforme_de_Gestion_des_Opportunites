using MediatR;
using System;

namespace omp.Application.Features.Livrables.Commands.CreateLivrable
{
    public class CreateLivrableCommand : IRequest<Guid>
    {
        public string Nom { get; set; }
        public int? Numero { get; set; }
        public int? StartWeek { get; set; }
        public int? EndWeek { get; set; }
        public int? Duration { get; set; }
        public int? TotalParLivrable { get; set; }
        public float? Pourcentage { get; set; }
        public Guid? IdPhase { get; set; }
    }
}