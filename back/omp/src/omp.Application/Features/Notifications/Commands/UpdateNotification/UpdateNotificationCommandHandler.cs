using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Notifications.Commands.UpdateNotification
{
    public class UpdateNotificationCommandHandler : IRequestHandler<UpdateNotificationCommand, Unit>
    {
        private readonly IApplicationDbContext _context;

        public UpdateNotificationCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Unit> Handle(UpdateNotificationCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                throw new KeyNotFoundException($"Notification with ID {request.Id} not found.");
            }

            entity.RecipientIds = request.RecipientIds;
            entity.SenderId = request.SenderId;
            entity.Title = request.Title;
            entity.Body = request.Body;
            entity.Read = request.Read;
            entity.DateRead = request.DateRead;
            entity.OpportuniteId = request.OpportuniteId;
            entity.PropositionFinanciereId = request.PropositionFinanciereId;

            await _context.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}
