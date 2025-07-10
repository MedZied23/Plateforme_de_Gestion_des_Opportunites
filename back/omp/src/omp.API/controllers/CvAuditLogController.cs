using Microsoft.AspNetCore.Mvc;
using MediatR;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using omp.Application.Features.CvAuditLogs.DTOs;
using omp.Application.Features.CvAuditLogs.Queries.GetAllCvAuditLogs;
using omp.Application.Features.CvAuditLogs.Queries.GetCvAuditLogById;
using omp.Application.Features.CvAuditLogs.Queries.GetCvAuditLogsByCvId;
using omp.Application.Features.CvAuditLogs.Commands.CreateCvAuditLog;
using omp.Application.Common.Models;

namespace omp.API.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CvAuditLogController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CvAuditLogController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedList<CvAuditLogDto>>> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string sortBy = "DateModification",
            [FromQuery] string sortDirection = "desc")
        {
            var query = new GetAllCvAuditLogsQuery
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
        public async Task<ActionResult<CvAuditLogDto>> Get(Guid id)
        {
            var result = await _mediator.Send(new GetCvAuditLogByIdQuery { Id = id });
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }        [HttpGet("cv/{cvId}")]
        public async Task<ActionResult<PaginatedList<CvAuditLogDto>>> GetByCvId(
            Guid cvId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string sortBy = "DateModification",
            [FromQuery] string sortDirection = "desc")
        {
            var query = new GetCvAuditLogsByCvIdQuery 
            { 
                CvId = cvId,
                PageNumber = pageNumber,
                PageSize = pageSize,
                SortBy = sortBy,
                SortDirection = sortDirection
            };
            
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateCvAuditLogCommand command)
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id = result }, result);
        }
    }
}