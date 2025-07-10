using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.CvAuditLogs.DTOs;

namespace omp.Application.Features.CvAuditLogs.Queries.GetAllCvAuditLogs
{
    public class GetAllCvAuditLogsQuery : IRequest<PaginatedList<CvAuditLogDto>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string SortBy { get; set; } = "DateModification";
        public string SortDirection { get; set; } = "desc";
    }
}