using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using omp.Application.Features.Users.Commands.CreateUser;
using omp.Application.Features.Users.Commands.UpdateUser;
using omp.Application.Features.Users.Commands.DeleteUser;
using omp.Application.Features.Users.Queries.GetUserById;
using omp.Application.Features.Users.Queries.GetUsersList;

namespace omp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UserController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetAll()
        {
            var query = new GetUsersListQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDetailDto>> GetById(Guid id)
        {
            var query = new GetUserByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        [AllowAnonymous] // Allow anonymous access for user creation
        //[Authorize(Roles = "Admin")] // Only admins can create users
        public async Task<ActionResult<Guid>> Create(CreateUserCommand command)
        {
            var userId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = userId }, userId);
        }        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // Only admins can update user roles
        public async Task<ActionResult<UserDetailDto>> Update(Guid id, UpdateUserCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            var result = await _mediator.Send(command);
            
            if (!result)
                return NotFound();

            // Get the updated user to return
            var updatedUser = await _mediator.Send(new GetUserByIdQuery { Id = id });
            return Ok(updatedUser);
        }        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // Only admins can delete users
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var result = await _mediator.Send(new DeleteUserCommand { Id = id });
                
                if (!result)
                    return NotFound();

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
