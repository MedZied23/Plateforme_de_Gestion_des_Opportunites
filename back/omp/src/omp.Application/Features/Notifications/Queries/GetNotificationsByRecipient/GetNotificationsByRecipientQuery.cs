using MediatR;
using omp.Application.Common.Models;
using omp.Application.Features.Notifications.DTOs;

namespace omp.Application.Features.Notifications.Queries.GetNotificationsByRecipient
{
    public class GetNotificationsByRecipientQuery : IRequest<PaginatedList<NotificationDto>>
    {
        public Guid RecipientId { get; set; }
        public bool? IsRead { get; set; } // Optional filter for read/unread notifications
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
