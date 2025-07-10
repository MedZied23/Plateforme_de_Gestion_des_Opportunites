using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.CvAuditLogs.DTOs;

namespace omp.Application.Features.CvAuditLogs.Queries.GetCvAuditLogById
{
    public class GetCvAuditLogByIdQueryHandler : IRequestHandler<GetCvAuditLogByIdQuery, CvAuditLogDto?>
    {
        private readonly IApplicationDbContext _context;

        public GetCvAuditLogByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CvAuditLogDto?> Handle(GetCvAuditLogByIdQuery request, CancellationToken cancellationToken)
        {
            var cvAuditLog = await _context.CvAuditLogs
                .FirstOrDefaultAsync(cal => cal.Id == request.Id, cancellationToken);

            if (cvAuditLog == null)
            {
                return null;
            }

            return new CvAuditLogDto
            {
                Id = cvAuditLog.Id,
                CvId = cvAuditLog.CvId,
                TypeOperation = cvAuditLog.TypeOperation,
                Element = cvAuditLog.Element,
                DateModification = cvAuditLog.DateModification,
                ModifiedBy = cvAuditLog.ModifiedBy
            };
        }
    }
}