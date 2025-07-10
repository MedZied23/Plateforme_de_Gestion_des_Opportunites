using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.OpportuniteTasks.Commands.CreateOpportuniteTask
{    public class CreateOpportuniteTaskCommand : IRequest<Guid>
    {
        public Guid? OpportuniteId { get; set; }
        public string? NewName { get; set; }
        public TaskType? Type { get; set; }
        public Dictionary<Guid, bool>? Equipe { get; set; } = new();
        public DateTime? DateDone { get; set; }
        public double? Percentage { get; set; }
        public bool? Done { get; set; }
        public Nature? Nature { get; set; }
        public StatutTache? Statut { get; set; }
    }
}
