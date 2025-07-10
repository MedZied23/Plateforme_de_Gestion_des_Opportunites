using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Linq.Expressions;
using System;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.CvAuditLogs.DTOs;

namespace omp.Application.Features.CvAuditLogs.Queries.GetCvAuditLogsByCvId
{
    public class GetCvAuditLogsByCvIdQueryHandler : IRequestHandler<GetCvAuditLogsByCvIdQuery, PaginatedList<CvAuditLogDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetCvAuditLogsByCvIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedList<CvAuditLogDto>> Handle(GetCvAuditLogsByCvIdQuery request, CancellationToken cancellationToken)
        {
            var query = _context.CvAuditLogs
                .Where(cal => cal.CvId == request.CvId)
                .Select(cal => new CvAuditLogDto
                {
                    Id = cal.Id,
                    CvId = cal.CvId,
                    TypeOperation = cal.TypeOperation,
                    Element = cal.Element,
                    DateModification = cal.DateModification,
                    ModifiedBy = cal.ModifiedBy
                })
                .AsQueryable();

            // Apply sorting based on request parameters
            query = ApplySorting(query, request.SortBy, request.SortDirection);

            // Execute the query and create paginated list
            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            var totalItems = await _context.CvAuditLogs
                .Where(cal => cal.CvId == request.CvId)
                .CountAsync(cancellationToken);

            return new PaginatedList<CvAuditLogDto>(
                items,
                totalItems,
                request.PageNumber,
                request.PageSize);
        }

        private IQueryable<CvAuditLogDto> ApplySorting(IQueryable<CvAuditLogDto> query, string sortBy, string sortDirection)
        {
            // Normalize the sort property name
            sortBy = sortBy?.ToLower() ?? "datemodification";

            // Define default expression for sorting by DateModification
            Expression<Func<CvAuditLogDto, object>> sortExpression = p => p.DateModification;

            // Map the property name to the corresponding property selector
            switch (sortBy)
            {
                case "datemodification":
                    sortExpression = p => p.DateModification;
                    break;
                case "id":
                    sortExpression = p => p.Id;
                    break;
                case "cvid":
                    sortExpression = p => p.CvId;
                    break;
                case "modifiedby":
                    sortExpression = p => p.ModifiedBy;
                    break;
                case "typeoperation":
                    sortExpression = p => p.TypeOperation;
                    break;
                case "element":
                    sortExpression = p => p.Element;
                    break;
            }

            // Apply the sort direction
            if (sortDirection?.ToLower() == "asc")
            {
                return query.OrderBy(sortExpression);
            }
            else
            {
                return query.OrderByDescending(sortExpression);
            }
        }
    }
}