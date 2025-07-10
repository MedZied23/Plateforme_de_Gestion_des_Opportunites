using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Notifications.DTOs;

namespace omp.Application.Features.Notifications.Queries.GetNotificationById
{
    public class GetNotificationByIdQueryHandler : IRequestHandler<GetNotificationByIdQuery, NotificationDto?>
    {
        private readonly IApplicationDbContext _context;

        public GetNotificationByIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<NotificationDto?> Handle(GetNotificationByIdQuery request, CancellationToken cancellationToken)
        {
            var notification = await _context.Notifications
                .Where(n => n.Id == request.Id)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    RecipientIds = n.RecipientIds,
                    SenderId = n.SenderId,
                    Title = n.Title,
                    Body = n.Body,
                    DateSent = n.DateSent,
                    Read = n.Read,
                    DateRead = n.DateRead,
                    OpportuniteId = n.OpportuniteId,
                    PropositionFinanciereId = n.PropositionFinanciereId
                })
                .FirstOrDefaultAsync(cancellationToken);

            return notification;
        }
    }
}
