using MediatR;

namespace omp.Application.Features.Notifications.Commands.MarkNotificationAsRead
{
    public class MarkNotificationAsReadCommand : IRequest<Unit>
    {
        public Guid NotificationId { get; set; }
    }
}
