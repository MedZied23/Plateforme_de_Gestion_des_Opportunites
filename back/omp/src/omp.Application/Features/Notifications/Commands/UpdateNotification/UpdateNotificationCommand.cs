using MediatR;
using omp.Application.Features.Notifications.DTOs;

namespace omp.Application.Features.Notifications.Commands.UpdateNotification
{
    public class UpdateNotificationCommand : NotificationDto, IRequest<Unit>
    {
        // Inherits all properties from NotificationDto
    }
}
