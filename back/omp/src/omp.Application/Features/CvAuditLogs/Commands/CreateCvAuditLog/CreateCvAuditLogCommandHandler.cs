using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.CvAuditLogs.Commands.CreateCvAuditLog
{
    public class CreateCvAuditLogCommandHandler : IRequestHandler<CreateCvAuditLogCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateCvAuditLogCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateCvAuditLogCommand request, CancellationToken cancellationToken)
        {
            var entity = new CvAuditLog
            {
                Id = Guid.NewGuid(),
                CvId = request.CvId,
                TypeOperation = request.TypeOperation,
                Element = request.Element,
                DateModification = DateTime.UtcNow,
                ModifiedBy = request.ModifiedBy
            };

            _context.CvAuditLogs.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}