using MediatR;
using omp.Application.Features.Notifications.DTOs;

namespace omp.Application.Features.Notifications.Commands.CreateNotification
{
    public class CreateNotificationCommand : NotificationDto, IRequest<Guid>
    {
        // Inherits all properties from NotificationDto
    }
}
