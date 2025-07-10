using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.Phases.Commands.CreatePhase;
using omp.Application.Features.Phases.Commands.UpdatePhase;
using omp.Application.Features.Phases.Commands.DeletePhase;
using omp.Application.Features.Phases.Queries.GetPhaseById;
using omp.Application.Features.Phases.Queries.GetPhasesList;
using omp.Application.Features.Phases.Queries.GetPhasesByPropositionId;
using omp.Application.Features.Phases.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhaseController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PhaseController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<PhaseDto>>> GetAll()
        {
            var query = new GetPhasesListQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PhaseDto>> GetById(Guid id)
        {
            var query = new GetPhaseByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }
        
        [HttpGet("byProposition/{propositionId}")]
        public async Task<ActionResult<List<PhaseDto>>> GetByPropositionId(Guid propositionId)
        {
            var query = new GetPhasesByPropositionIdQuery { PropositionId = propositionId };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreatePhaseCommand command)
        {
            var phaseId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = phaseId }, phaseId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdatePhaseCommand command)
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
            var result = await _mediator.Send(new DeletePhaseCommand { Id = id });
            
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}