using System;
using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.CvAuditLogs.Commands.CreateCvAuditLog
{
    public class CreateCvAuditLogCommand : IRequest<Guid>
    {
        public Guid CvId { get; set; }
        public Operations TypeOperation { get; set; }
        public ElementsCv Element { get; set; }
        public Guid ModifiedBy { get; set; }
    }
}