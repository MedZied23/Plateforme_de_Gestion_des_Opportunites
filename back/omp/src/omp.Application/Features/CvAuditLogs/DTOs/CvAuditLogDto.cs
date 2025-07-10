using System;
using omp.Domain.Entites;

namespace omp.Application.Features.CvAuditLogs.DTOs
{
    public class CvAuditLogDto
    {
        public Guid Id { get; set; }
        public Guid CvId { get; set; }
        public Operations TypeOperation { get; set; }
        public ElementsCv Element { get; set; }
        public DateTime DateModification { get; set; }
        public Guid ModifiedBy { get; set; }
    }
}