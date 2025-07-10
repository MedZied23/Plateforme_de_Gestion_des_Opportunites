using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Notifications.Commands.DeleteNotification
{
    public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, Unit>
    {
        private readonly IApplicationDbContext _context;

        public DeleteNotificationCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Unit> Handle(DeleteNotificationCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                throw new KeyNotFoundException($"Notification with ID {request.Id} not found.");
            }

            _context.Notifications.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}
