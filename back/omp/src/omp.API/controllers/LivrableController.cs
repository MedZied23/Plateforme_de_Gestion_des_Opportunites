using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.Livrables.Commands.CreateLivrable;
using omp.Application.Features.Livrables.Commands.UpdateLivrable;
using omp.Application.Features.Livrables.Commands.DeleteLivrable;
using omp.Application.Features.Livrables.Queries.GetLivrableById;
using omp.Application.Features.Livrables.Queries.GetLivrablesList;
using omp.Application.Features.Livrables.Queries.GetLivrablesByPhaseId;
using omp.Application.Features.Livrables.Queries.GetLivrablesByPropositionFinanciereId;
using omp.Application.Features.Livrables.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LivrableController : ControllerBase
    {
        private readonly IMediator _mediator;

        public LivrableController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<LivrableDto>>> GetAll([FromQuery] Guid? propositionFinanciereId = null)
        {
            // If a propositionFinanciereId is provided, filter by that instead of returning all livrables
            if (propositionFinanciereId.HasValue)
            {
                var query = new GetLivrablesByPropositionFinanciereIdQuery { PropositionFinanciereId = propositionFinanciereId.Value };
                var result = await _mediator.Send(query);
                return Ok(result);
            }
            else
            {
                // Original behavior - get all livrables (should only be used for admin purposes)
                var query = new GetLivrablesListQuery();
                var result = await _mediator.Send(query);
                return Ok(result);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LivrableDto>> GetById(Guid id)
        {
            var query = new GetLivrableByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpGet("phase/{phaseId}")]
        public async Task<ActionResult<List<LivrableDto>>> GetByPhaseId(Guid phaseId)
        {
            var query = new GetLivrablesByPhaseIdQuery { PhaseId = phaseId };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("proposition/{propositionFinanciereId}")]
        public async Task<ActionResult<List<LivrableDto>>> GetByPropositionFinanciereId(Guid propositionFinanciereId)
        {
            var query = new GetLivrablesByPropositionFinanciereIdQuery { PropositionFinanciereId = propositionFinanciereId };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateLivrableCommand command)
        {
            var livrableId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = livrableId }, livrableId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateLivrableCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            var result = await _mediator.Send(command);
            
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _mediator.Send(new DeleteLivrableCommand { Id = id });
            
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}