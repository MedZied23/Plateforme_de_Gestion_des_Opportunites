using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.Partenaires.Commands.CreatePartenaire;
using omp.Application.Features.Partenaires.Commands.UpdatePartenaire;
using omp.Application.Features.Partenaires.Commands.DeletePartenaire;
using omp.Application.Features.Partenaires.Queries.GetPartenaireById;
using omp.Application.Features.Partenaires.Queries.GetPartenairesList;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartenaireController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PartenaireController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<PartenaireDto>>> GetAll()
        {
            var query = new GetPartenairesListQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PartenaireDetailDto>> GetById(Guid id)
        {
            var query = new GetPartenaireByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreatePartenaireCommand command)
        {
            var partenaireId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = partenaireId }, partenaireId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdatePartenaireCommand command)
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
            var result = await _mediator.Send(new DeletePartenaireCommand { Id = id });
            
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}
