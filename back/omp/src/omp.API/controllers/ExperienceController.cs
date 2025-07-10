using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Features.Experiences.Commands.CreateExperience;
using omp.Application.Features.Experiences.Commands.DeleteExperience;
using omp.Application.Features.Experiences.Commands.UpdateExperience;
using omp.Application.Features.Experiences.DTOs;
using omp.Application.Features.Experiences.Queries.GetAllExperiences;
using omp.Application.Features.Experiences.Queries.GetExperienceById;

namespace omp.API.controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExperienceController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ExperienceController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<ExperienceDto>>> GetAll()
        {
            var result = await _mediator.Send(new GetAllExperiencesQuery());
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ExperienceDto>> Get(Guid id)
        {
            var result = await _mediator.Send(new GetExperienceByIdQuery { Id = id });
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateExperienceCommand command)
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id = result }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateExperienceCommand command)
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
            var command = new DeleteExperienceCommand { Id = id };
            var result = await _mediator.Send(command);
            
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}