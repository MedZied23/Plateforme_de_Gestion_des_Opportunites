using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Auth.Commands.AuthenticateUser
{
    public class AuthenticateCommandHandler : IRequestHandler<AuthenticateCommand, AuthenticationResponse>
    {
        private readonly IIdentityService _identityService;

        public AuthenticateCommandHandler(IIdentityService identityService)
        {
            _identityService = identityService;
        }

        public async Task<AuthenticationResponse> Handle(AuthenticateCommand request, CancellationToken cancellationToken)
        {
            var (isValid, user) = await _identityService.ValidateUserAsync(request.Email, request.Password);

            if (!isValid || user == null)
                throw new UnauthorizedAccessException("Invalid credentials");

            var token = await _identityService.GenerateJwtTokenAsync(user);            return new AuthenticationResponse
            {
                Token = token,
                Email = user.Email,
                Nom = user.Nom,
                Prenom = user.Prenom,
                Role = user.Role
            };
        }
    }
}