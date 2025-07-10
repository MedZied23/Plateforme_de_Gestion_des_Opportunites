using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.Notifications.Commands.CreateNotification;
using omp.Application.Features.Notifications.Commands.UpdateNotification;
using omp.Application.Features.Notifications.Commands.DeleteNotification;
using omp.Application.Features.Notifications.Commands.MarkNotificationAsRead;
using omp.Application.Features.Notifications.Queries.GetNotificationById;
using omp.Application.Features.Notifications.Queries.GetNotificationsList;
using omp.Application.Features.Notifications.Queries.GetNotificationsByRecipient;
using omp.Application.Features.Notifications.DTOs;
using omp.Application.Common.Models;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public NotificationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<NotificationDto>>> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] Guid? senderId = null,
            [FromQuery] bool? isRead = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var query = new GetNotificationsListQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SenderId = senderId,
                IsRead = isRead,
                FromDate = fromDate,
                ToDate = toDate
            };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NotificationDto>> GetById(Guid id)
        {
            var query = new GetNotificationByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }        [HttpGet("recipient/{recipientId}")]
        public async Task<ActionResult<PaginatedList<NotificationDto>>> GetByRecipient(
            Guid recipientId,
            [FromQuery] bool? isRead = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = new GetNotificationsByRecipientQuery 
            { 
                RecipientId = recipientId,
                IsRead = isRead,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateNotificationCommand command)
        {
            var notificationId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = notificationId }, notificationId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateNotificationCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            await _mediator.Send(command);
            return NoContent();
        }

        [HttpPatch("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var command = new MarkNotificationAsReadCommand { NotificationId = id };
            await _mediator.Send(command);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _mediator.Send(new DeleteNotificationCommand { Id = id });
            return NoContent();
        }
    }
}
