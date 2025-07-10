using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.Notifications.DTOs;

namespace omp.Application.Features.Notifications.Queries.GetNotificationsByRecipient
{
    public class GetNotificationsByRecipientQueryHandler : IRequestHandler<GetNotificationsByRecipientQuery, PaginatedList<NotificationDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetNotificationsByRecipientQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }        public async Task<PaginatedList<NotificationDto>> Handle(GetNotificationsByRecipientQuery request, CancellationToken cancellationToken)
        {
            // For now, we'll load all notifications and filter in memory
            // This is not ideal for large datasets but will work for the initial implementation
            var allNotifications = await _context.Notifications
                .ToListAsync(cancellationToken);

            // Filter by recipient in memory
            var filteredNotifications = allNotifications
                .Where(n => n.RecipientIds.Contains(request.RecipientId));

            if (request.IsRead.HasValue)
            {
                filteredNotifications = filteredNotifications.Where(n => n.Read == request.IsRead.Value);
            }

            var orderedNotifications = filteredNotifications
                .OrderByDescending(n => n.DateSent);

            var totalCount = orderedNotifications.Count();

            var items = orderedNotifications
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
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
                .ToList();

            return new PaginatedList<NotificationDto>(
                items,
                totalCount,
                request.PageNumber,
                request.PageSize);
        }
    }
}
