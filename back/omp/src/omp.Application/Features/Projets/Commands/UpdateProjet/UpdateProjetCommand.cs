using System;
using System.Collections.Generic;
using MediatR;

namespace omp.Application.Features.Projets.Commands.UpdateProjet
{    public class UpdateProjetCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
        public string? Nom { get; set; }
        public int? Year { get; set; }
        public string? Client { get; set; }
        public string? Domaine { get; set; }
        public Dictionary<string, List<string>>? Perimetre { get; set; }
        public string? Role { get; set; }
        public bool Hide { get; set; }
        public Guid? ReferenceId { get; set; }
    }
}