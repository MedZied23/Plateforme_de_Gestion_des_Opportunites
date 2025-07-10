using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Common.Models;
using omp.Application.Features.References.Commands.CreateReference;
using omp.Application.Features.References.Commands.DeleteReference;
using omp.Application.Features.References.Commands.UpdateReference;
using omp.Application.Features.References.DTOs;
using omp.Application.Features.References.Queries.GetReferenceById;
using omp.Application.Features.References.Queries.GetReferencesList;
using omp.Application.Features.References.Queries.SearchReferencesByKeywords;

namespace omp.API.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReferenceController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ReferenceController(IMediator mediator)
        {
            _mediator = mediator;
        }        [HttpGet]
        public async Task<ActionResult<PaginatedList<ReferenceDto>>> GetAll(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 6,
            [FromQuery] string sortBy = "LastAccessed",
            [FromQuery] string sortDirection = "desc")
        {
            var query = new GetReferencesListQuery
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
        public async Task<ActionResult<PaginatedList<ReferenceSearchResultDto>>> Search(
            [FromQuery] string? keywords,
            [FromQuery] bool useFuzzySearch = true,
            [FromQuery] int minimumSimilarityScore = 70,
            [FromQuery] string? offre = null,
            [FromQuery] string? country = null,
            [FromQuery] DateTime? dateDebutMin = null,
            [FromQuery] DateTime? dateDebutMax = null,
            [FromQuery] DateTime? dateFinMin = null,
            [FromQuery] DateTime? dateFinMax = null,
            [FromQuery] long? budgetMin = null,
            [FromQuery] long? budgetMax = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 6)
        {
            var query = new SearchReferencesByKeywordsQuery
            {
                Keywords = keywords ?? "",
                UseFuzzySearch = useFuzzySearch,
                MinimumSimilarityScore = minimumSimilarityScore,
                Offre = offre,
                Country = country,
                DateDebutMin = dateDebutMin,
                DateDebutMax = dateDebutMax,
                DateFinMin = dateFinMin,
                DateFinMax = dateFinMax,
                BudgetMin = budgetMin,
                BudgetMax = budgetMax,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ReferenceDto>> GetById(Guid id)
        {
            try
            {
                return await _mediator.Send(new GetReferenceByIdQuery { Id = id });
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<ActionResult<ReferenceDto>> Create(CreateReferenceCommand command)
        {
            return await _mediator.Send(command);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ReferenceDto>> Update(Guid id, UpdateReferenceCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest("ID mismatch between URL and command body");
            }

            try
            {
                return await _mediator.Send(command);
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                await _mediator.Send(new DeleteReferenceCommand { Id = id });
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}