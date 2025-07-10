using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.Notifications.DTOs;

namespace omp.Application.Features.Notifications.Queries.GetNotificationsList
{
    public class GetNotificationsListQueryHandler : IRequestHandler<GetNotificationsListQuery, List<NotificationDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetNotificationsListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<NotificationDto>> Handle(GetNotificationsListQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Notifications.AsQueryable();

            // Apply filters
            if (request.SenderId.HasValue)
            {
                query = query.Where(n => n.SenderId == request.SenderId.Value);
            }

            if (request.IsRead.HasValue)
            {
                query = query.Where(n => n.Read == request.IsRead.Value);
            }

            if (request.FromDate.HasValue)
            {
                query = query.Where(n => n.DateSent >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(n => n.DateSent <= request.ToDate.Value);
            }

            var notifications = await query
                .OrderByDescending(n => n.DateSent)
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
                .ToListAsync(cancellationToken);

            return notifications;
        }
    }
}
