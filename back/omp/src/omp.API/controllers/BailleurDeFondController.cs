using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.BailleursDeFond.Commands.CreateBailleurDeFond;
using omp.Application.Features.BailleursDeFond.Commands.UpdateBailleurDeFond;
using omp.Application.Features.BailleursDeFond.Commands.DeleteBailleurDeFond;
using omp.Application.Features.BailleursDeFond.Queries.GetBailleurDeFondById;
using omp.Application.Features.BailleursDeFond.Queries.GetAllBailleursDeFond;
using omp.Application.Features.BailleursDeFond.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BailleurDeFondController : ControllerBase
    {
        private readonly IMediator _mediator;

        public BailleurDeFondController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<BailleurDeFondDto>>> GetAll()
        {
            var query = new GetAllBailleursDeFondQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BailleurDeFondDto>> GetById(Guid id)
        {
            var query = new GetBailleurDeFondByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateBailleurDeFondCommand command)
        {
            var bailleurId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = bailleurId }, bailleurId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateBailleurDeFondCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            await _mediator.Send(command);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var command = new DeleteBailleurDeFondCommand { Id = id };
            await _mediator.Send(command);
            return NoContent();
        }
    }
}