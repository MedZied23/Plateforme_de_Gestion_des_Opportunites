using MediatR;
using Microsoft.AspNetCore.Mvc;
using omp.Application.Features.Profils.Commands.CreateProfil;
using omp.Application.Features.Profils.Commands.DeleteProfil;
using omp.Application.Features.Profils.Commands.UpdateProfil;
using omp.Application.Features.Profils.DTOs;
using omp.Application.Features.Profils.Queries.GetProfilById;
using omp.Application.Features.Profils.Queries.GetProfilsByPropositionFinanciere;
using omp.Application.Features.Profils.Queries.GetProfilsList;

namespace omp.API.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfilController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ProfilController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // GET: api/profil
        [HttpGet]
        public async Task<ActionResult<List<ProfilDto>>> GetAll()
        {
            var result = await _mediator.Send(new GetProfilsListQuery());
            return Ok(result);
        }

        // GET: api/profil/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProfilDto>> GetById(Guid id)
        {
            var result = await _mediator.Send(new GetProfilByIdQuery { Id = id });
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        // GET: api/profil/proposition/{propositionFinanciereId}
        [HttpGet("proposition/{propositionFinanciereId}")]
        public async Task<ActionResult<List<ProfilDto>>> GetByPropositionFinanciereId(Guid propositionFinanciereId)
        {
            var result = await _mediator.Send(new GetProfilsByPropositionFinanciereQuery { PropositionFinanciereId = propositionFinanciereId });
            return Ok(result);
        }

        // POST: api/profil
        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateProfilCommand command)
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = result }, result);
        }

        // PUT: api/profil/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateProfilCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            var result = await _mediator.Send(command);
            if (!result)
                return NotFound();

            return NoContent();
        }

        // DELETE: api/profil/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var result = await _mediator.Send(new DeleteProfilCommand { Id = id });
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}