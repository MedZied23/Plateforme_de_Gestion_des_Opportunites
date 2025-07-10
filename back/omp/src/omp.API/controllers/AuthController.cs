using Microsoft.AspNetCore.Mvc;
using MediatR;
using omp.Application.Features.Auth.Commands.AuthenticateUser;

namespace omp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthenticationResponse>> Login(AuthenticateCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(result);
            }            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }
        }
    }
}