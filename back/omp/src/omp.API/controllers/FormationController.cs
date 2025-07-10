using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Features.Formations.Commands.CreateFormation;
using omp.Application.Features.Formations.Commands.DeleteFormation;
using omp.Application.Features.Formations.Commands.UpdateFormation;
using omp.Application.Features.Formations.DTOs;
using omp.Application.Features.Formations.Queries.GetAllFormations;
using omp.Application.Features.Formations.Queries.GetFormationById;

namespace omp.API.controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FormationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public FormationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<FormationDto>>> GetAll()
        {
            var result = await _mediator.Send(new GetAllFormationsQuery());
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FormationDto>> Get(Guid id)
        {
            var result = await _mediator.Send(new GetFormationByIdQuery { Id = id });
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateFormationCommand command)
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id = result }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateFormationCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest();
            }

            var result = await _mediator.Send(command);
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var command = new DeleteFormationCommand { Id = id };
            var result = await _mediator.Send(command);
            
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}