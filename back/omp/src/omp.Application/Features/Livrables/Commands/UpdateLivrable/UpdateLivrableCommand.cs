using MediatR;
using System;

namespace omp.Application.Features.Livrables.Commands.UpdateLivrable
{
    public class UpdateLivrableCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
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