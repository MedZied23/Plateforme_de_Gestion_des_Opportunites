using System;
using System.Collections.Generic;
using MediatR;

namespace omp.Application.Features.Projets.Commands.CreateProjet
{    public class CreateProjetCommand : IRequest<Guid>
    {
        public string? Nom { get; set; }
        public int? Year { get; set; }
        public string? Client { get; set; }
        public string? Domaine { get; set; }
        public Dictionary<string, List<string>>? Perimetre { get; set; }
        public string? Role { get; set; }
        public bool Hide { get; set; } = false;
        public Guid? CvId { get; set; }
        public Guid? ReferenceId { get; set; }
    }
}