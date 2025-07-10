using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Features.Projets.Commands.CreateProjet;
using omp.Application.Features.Projets.Commands.DeleteProjet;
using omp.Application.Features.Projets.Commands.PatchProjet;
using omp.Application.Features.Projets.Commands.UpdateProjet;
using omp.Application.Features.Projets.DTOs;
using omp.Application.Features.Projets.Queries.GetAllProjets;
using omp.Application.Features.Projets.Queries.GetProjetById;

namespace omp.API.controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjetController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ProjetController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProjetDto>>> GetAll()
        {
            var result = await _mediator.Send(new GetAllProjetsQuery());
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjetDto>> Get(Guid id)
        {
            var result = await _mediator.Send(new GetProjetByIdQuery { Id = id });
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateProjetCommand command)
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id = result }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateProjetCommand command)
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

        [HttpPatch("{id}")]
        public async Task<ActionResult> Patch(Guid id, PatchProjetCommand command)
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
            var command = new DeleteProjetCommand { Id = id };
            var result = await _mediator.Send(command);
            
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}