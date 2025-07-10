using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.OpportuniteTasks.Commands.CreateOpportuniteTask;
using omp.Application.Features.OpportuniteTasks.Commands.UpdateOpportuniteTask;
using omp.Application.Features.OpportuniteTasks.Commands.DeleteOpportuniteTask;
using omp.Application.Features.OpportuniteTasks.Queries.GetOpportuniteTaskById;
using omp.Application.Features.OpportuniteTasks.Queries.GetOpportuniteTasksByOpportuniteId;
using omp.Application.Features.OpportuniteTasks.DTOs;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OpportuniteTaskController : ControllerBase
    {
        private readonly IMediator _mediator;

        public OpportuniteTaskController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Get a specific OpportuniteTask by ID
        /// </summary>
        /// <param name="id">The ID of the OpportuniteTask</param>
        /// <returns>The OpportuniteTask</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<OpportuniteTaskDto>> GetOpportuniteTaskById(Guid id)
        {
            var query = new GetOpportuniteTaskByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
            {
                return NotFound($"OpportuniteTask with ID {id} not found.");
            }

            return Ok(result);
        }        /// <summary>
        /// Get all OpportuniteTasks for a specific Opportunite
        /// </summary>
        /// <param name="opportuniteId">The ID of the Opportunite</param>
        /// <returns>List of OpportuniteTasks for the Opportunite</returns>
        [HttpGet("by-opportunite/{opportuniteId}")]
        public async Task<ActionResult<List<OpportuniteTaskDto>>> GetOpportuniteTasksByOpportuniteId(Guid opportuniteId)
        {
            var query = new GetOpportuniteTasksByOpportuniteIdQuery { OpportuniteId = opportuniteId };
            var result = await _mediator.Send(query);

            return Ok(result);
        }

        /// <summary>
        /// Create a new OpportuniteTask
        /// </summary>
        /// <param name="command">The create command</param>
        /// <returns>The ID of the created OpportuniteTask</returns>
        [HttpPost]
        public async Task<ActionResult<Guid>> CreateOpportuniteTask(CreateOpportuniteTaskCommand command)
        {
            var opportuniteTaskId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetOpportuniteTaskById), new { id = opportuniteTaskId }, opportuniteTaskId);
        }        /// <summary>
        /// Update an existing OpportuniteTask
        /// </summary>
        /// <param name="id">The ID of the OpportuniteTask to update</param>
        /// <param name="command">The update command</param>
        /// <returns>Success status</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateOpportuniteTask(Guid id, UpdateOpportuniteTaskCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest("ID in URL does not match ID in request body.");
            }

            var result = await _mediator.Send(command);

            if (!result)
            {
                return NotFound($"OpportuniteTask with ID {id} not found.");
            }

            return NoContent();
        }

        /// <summary>
        /// Delete an existing OpportuniteTask
        /// </summary>
        /// <param name="id">The ID of the OpportuniteTask to delete</param>
        /// <returns>Success status</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteOpportuniteTask(Guid id)
        {
            var command = new DeleteOpportuniteTaskCommand { Id = id };
            var result = await _mediator.Send(command);

            if (!result)
            {
                return NotFound($"OpportuniteTask with ID {id} not found.");
            }

            return NoContent();
        }
    }
}
