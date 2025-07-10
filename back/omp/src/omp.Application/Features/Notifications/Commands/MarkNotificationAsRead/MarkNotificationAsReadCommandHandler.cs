using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Notifications.Commands.MarkNotificationAsRead
{
    public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, Unit>
    {
        private readonly IApplicationDbContext _context;

        public MarkNotificationAsReadCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Unit> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == request.NotificationId, cancellationToken);

            if (entity == null)
            {
                throw new KeyNotFoundException($"Notification with ID {request.NotificationId} not found.");
            }

            entity.Read = true;
            entity.DateRead = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}
