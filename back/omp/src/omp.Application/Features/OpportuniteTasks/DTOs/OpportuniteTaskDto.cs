using System;
using System.Collections.Generic;
using omp.Domain.Entites;

namespace omp.Application.Features.OpportuniteTasks.DTOs
{
    public class OpportuniteTaskDto
    {        public Guid Id { get; set; }
        public Guid? OpportuniteId { get; set; }
        public TaskName? Name { get; set; }
        public string? NewName { get; set; }
        public TaskType? Type { get; set; }
        public Dictionary<Guid, bool>? Equipe { get; set; } = new();
        public DateTime? DateAssigned { get; set; }
        public DateTime? DateDone { get; set; }
        public double? Percentage { get; set; }
        public int? Numero { get; set; }
        public bool? Done { get; set; }
        public Nature? Nature { get; set; }
        public StatutTache? Statut { get; set; }
    }
}