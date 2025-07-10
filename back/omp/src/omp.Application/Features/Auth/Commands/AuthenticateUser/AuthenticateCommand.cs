using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.Auth.Commands.AuthenticateUser
{
    public class AuthenticateCommand : IRequest<AuthenticationResponse>
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class AuthenticationResponse
    {
        public required string Token { get; set; }
        public required string Email { get; set; }
        public required string Nom { get; set; }
        public required string Prenom { get; set; }
        public Role Role { get; set; }
    }
}