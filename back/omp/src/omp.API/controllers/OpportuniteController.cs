using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.Opportunites.Commands.CreateOpportunite;
using omp.Application.Features.Opportunites.Commands.UpdateOpportunite;
using omp.Application.Features.Opportunites.Commands.DeleteOpportunite;
using omp.Application.Features.Opportunites.Queries.GetOpportuniteById;
using omp.Application.Features.Opportunites.Queries.GetOpportunitesList;
using omp.Application.Features.Opportunites.Queries.GetUserOpportunitesList;
using omp.Application.Features.Opportunites.Queries.GetOpportuniteByPropositionFinanciereId;
using omp.Application.Features.Opportunites.DTOs;
using omp.Application.Common.Models;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]    public class OpportuniteController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ICurrentUserService _currentUserService;

        public OpportuniteController(IMediator mediator, ICurrentUserService currentUserService)
        {
            _mediator = mediator;
            _currentUserService = currentUserService;
        }        
        [HttpGet]
        public async Task<ActionResult<PaginatedList<OpportuniteDto>>> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string sortBy = "DateModification",
            [FromQuery] string sortDirection = "desc")
        {
            var currentUserId = _currentUserService.UserId;
            if (!currentUserId.HasValue)
            {
                return Unauthorized("User must be authenticated");
            }

            // Use the filtered query that only returns opportunities the user is part of
            var query = new GetUserOpportunitesListQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SortBy = sortBy,
                SortDirection = sortDirection,
                UserId = currentUserId.Value
            };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OpportuniteDto>> GetById(Guid id)
        {
            var query = new GetOpportuniteByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }
        
        [HttpGet("proposition-financiere/{propositionFinanciereId}")]
        public async Task<ActionResult<Guid?>> GetByPropositionFinanciereId(Guid propositionFinanciereId)
        {
            var query = new GetOpportuniteByPropositionFinanciereIdQuery { PropositionFinanciereId = propositionFinanciereId };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateOpportuniteCommand command)
        {
            var opportuniteId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = opportuniteId }, opportuniteId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateOpportuniteCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            var result = await _mediator.Send(command);
            
            if (!result)
                return NotFound();

            return NoContent();
        }        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _mediator.Send(new DeleteOpportuniteCommand { Id = id });
            
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpGet("debug/current-user")]
        public ActionResult GetCurrentUserDebug()
        {
            var currentUserId = _currentUserService.UserId;
            var currentUserRole = _currentUserService.UserRole;
            var isAuthenticated = _currentUserService.IsAuthenticated;
            
            return Ok(new {
                UserId = currentUserId,
                UserRole = currentUserRole,
                IsAuthenticated = isAuthenticated,
                RoleString = currentUserRole?.ToString(),
                CanCreateOpportunity = currentUserRole == Role.Manager || 
                                     currentUserRole == Role.SeniorManager || 
                                     currentUserRole == Role.Directeur || 
                                     currentUserRole == Role.Associe
            });
        }
    }
}
