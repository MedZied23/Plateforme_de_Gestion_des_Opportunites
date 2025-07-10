using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.PropositionsFinancieres.Commands.CreatePropositionFinanciere;
using omp.Application.Features.PropositionsFinancieres.Commands.UpdatePropositionFinanciere;
using omp.Application.Features.PropositionsFinancieres.Commands.DeletePropositionFinanciere;
using omp.Application.Features.PropositionsFinancieres.Queries.GetPropositionFinanciereById;
using omp.Application.Features.PropositionsFinancieres.Queries.GetPropositionsFinancieresList;
using omp.Application.Features.PropositionsFinancieres.DTOs;
using omp.Application.Common.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PropositionFinanciereController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PropositionFinanciereController(IMediator mediator)
        {
            _mediator = mediator;
        }        [HttpGet]
        public async Task<ActionResult<PaginatedList<PropositionFinanciereDto>>> GetAll(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 6,
            [FromQuery] string sortBy = "DateModification",
            [FromQuery] string sortDirection = "desc")
        {
            var query = new GetPropositionsFinancieresListQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SortBy = sortBy,
                SortDirection = sortDirection
            };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PropositionFinanciereDto>> GetById(Guid id)
        {
            var query = new GetPropositionFinanciereByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreatePropositionFinanciereCommand command)
        {
            var propositionFinanciereId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = propositionFinanciereId }, propositionFinanciereId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdatePropositionFinanciereCommand command)
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
            var result = await _mediator.Send(new DeletePropositionFinanciereCommand { Id = id });
            
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}