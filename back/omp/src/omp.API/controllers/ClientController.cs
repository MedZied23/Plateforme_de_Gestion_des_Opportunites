using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.Clients.Commands.CreateClient;
using omp.Application.Features.Clients.Commands.UpdateClient;
using omp.Application.Features.Clients.Commands.DeleteClient;
using omp.Application.Features.Clients.Queries.GetClientById;
using omp.Application.Features.Clients.Queries.GetClientsList;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ClientController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<ClientDto>>> GetAll()
        {
            var query = new GetClientsListQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ClientDetailDto>> GetById(Guid id)
        {
            var query = new GetClientByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateClientCommand command)
        {
            var clientId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = clientId }, clientId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateClientCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            await _mediator.Send(command);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _mediator.Send(new DeleteClientCommand { Id = id });
            return NoContent();
        }
    }
}
