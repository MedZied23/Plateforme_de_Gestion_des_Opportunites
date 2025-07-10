using MediatR;
using omp.Application.Features.Notifications.DTOs;

namespace omp.Application.Features.Notifications.Queries.GetNotificationById
{
    public class GetNotificationByIdQuery : IRequest<NotificationDto?>
    {
        public Guid Id { get; set; }
    }
}
