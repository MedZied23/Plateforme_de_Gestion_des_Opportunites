using MediatR;
using omp.Domain.Entites;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Users.Commands.CreateUser
{
    public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly IIdentityService _identityService;

        public CreateUserCommandHandler(IApplicationDbContext context, IIdentityService identityService)
        {
            _context = context;
            _identityService = identityService;
        }        public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _identityService.CreateUserAsync(
                    request.Nom,
                    request.Prenom,
                    request.Email,
                    request.Password,
                    request.Phone,
                    request.Role);

                return user.Id;
            }
            catch (InvalidOperationException ex)
            {
                throw new Exception($"Failed to create user: {ex.Message}");
            }
        }
    }
}
