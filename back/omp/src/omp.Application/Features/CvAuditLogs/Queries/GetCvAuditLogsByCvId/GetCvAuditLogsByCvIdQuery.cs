using System;
using System.Collections.Generic;
using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.CvAuditLogs.DTOs;

namespace omp.Application.Features.CvAuditLogs.Queries.GetCvAuditLogsByCvId
{
    public class GetCvAuditLogsByCvIdQuery : IRequest<PaginatedList<CvAuditLogDto>>
    {
        public Guid CvId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string SortBy { get; set; } = "DateModification";
        public string SortDirection { get; set; } = "desc";
    }
}