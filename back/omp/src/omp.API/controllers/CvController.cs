using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Common.Models;
using omp.Application.Features.Cvs.Commands.CreateCv;
using omp.Application.Features.Cvs.Commands.CreateEmptyCv;
using omp.Application.Features.Cvs.Commands.DeleteCv;
using omp.Application.Features.Cvs.Commands.UpdateCv;
using omp.Application.Features.Cvs.DTOs;
using omp.Application.Features.Cvs.Queries.GetAllCvs;
using omp.Application.Features.Cvs.Queries.GetCvById;
using omp.Application.Features.Cvs.Queries.GetCvByUserId;
using omp.Application.Features.Cvs.Queries.SearchCvsByProjectKeywords;

namespace omp.API.controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CvController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CvController(IMediator mediator)
        {
            _mediator = mediator;
        }        [HttpGet]
        public async Task<ActionResult<PaginatedList<CvDto>>> GetAll(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 6,
            [FromQuery] string sortBy = "LastAccessed",
            [FromQuery] string sortDirection = "desc")
        {
            var query = new GetAllCvsQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SortBy = sortBy,
                SortDirection = sortDirection
            };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
          [HttpGet("search")]
        public async Task<ActionResult<PaginatedList<CvSearchResultDto>>> Search(
            [FromQuery] string keywords,
            [FromQuery] bool useFuzzySearch = true,
            [FromQuery] int minimumSimilarityScore = 70,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 6)
        {
            var query = new SearchCvsByProjectKeywordsQuery
            {
                Keywords = keywords,
                UseFuzzySearch = useFuzzySearch,
                MinimumSimilarityScore = minimumSimilarityScore,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CvDto>> Get(Guid id)
        {
            var result = await _mediator.Send(new GetCvByIdQuery { Id = id });
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<CvDto>> GetByUserId(Guid userId)
        {
            var result = await _mediator.Send(new GetCvByUserIdQuery { UserId = userId });
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateCvCommand command)
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id = result }, result);
        }

        [HttpPost("empty")]
        public async Task<ActionResult<Guid>> CreateEmpty()
        {
            var result = await _mediator.Send(new CreateEmptyCvCommand());
            return CreatedAtAction(nameof(Get), new { id = result }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateCvCommand command)
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
            var command = new DeleteCvCommand { Id = id };
            var result = await _mediator.Send(command);
            
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}