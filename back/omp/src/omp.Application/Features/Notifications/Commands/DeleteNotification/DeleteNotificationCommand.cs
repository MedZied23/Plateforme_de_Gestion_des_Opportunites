using MediatR;

namespace omp.Application.Features.Notifications.Commands.DeleteNotification
{
    public class DeleteNotificationCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }
    }
}
