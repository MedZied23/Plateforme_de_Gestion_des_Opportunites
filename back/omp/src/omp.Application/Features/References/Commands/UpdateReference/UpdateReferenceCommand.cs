using System;
using System.Collections.Generic;
using MediatR;
using omp.Application.Features.References.DTOs;

namespace omp.Application.Features.References.Commands.UpdateReference
{
    public class UpdateReferenceCommand : IRequest<ReferenceDto>
    {
        public Guid Id { get; set; }
        public string? Nom { get; set; }
        public string? Country { get; set; }
        public string? Offre { get; set; }
        public string? Client { get; set; }
        public long? Budget { get; set; }
        public DateTime? DateDebut { get; set; }
        public DateTime? DateFin { get; set; }
        public Dictionary<Guid,string>? Equipe { get; set; } = new Dictionary<Guid,string>();
        public string? Description { get; set; }
        public Dictionary<string, Dictionary<string, List<string>>>? Services { get; set; } = new Dictionary<string, Dictionary<string, List<string>>>();
        public string? DocumentUrl { get; set; }
        // We don't include LastModified and LastAccessed in the command as these will be set by the handler
    }
}