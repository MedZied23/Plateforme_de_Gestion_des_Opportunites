using System;
using MediatR;
using omp.Application.Features.CvAuditLogs.DTOs;

namespace omp.Application.Features.CvAuditLogs.Queries.GetCvAuditLogById
{
    public class GetCvAuditLogByIdQuery : IRequest<CvAuditLogDto?>
    {
        public Guid Id { get; set; }
    }
}