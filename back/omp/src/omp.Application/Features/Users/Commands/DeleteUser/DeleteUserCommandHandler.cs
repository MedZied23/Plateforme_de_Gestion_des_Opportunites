using MediatR;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.Users.Commands.DeleteUser
{
    public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public DeleteUserCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }        public async Task<bool> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Users.FindAsync(request.Id);
            
            if (entity == null) return false;

            // Check if the current user is trying to delete themselves and they are an admin
            var currentUserId = _currentUserService.UserId;
            var currentUserRole = _currentUserService.UserRole;
            
            if (currentUserId.HasValue && 
                currentUserId.Value == request.Id && 
                currentUserRole == Role.Admin)
            {
                // Prevent admin from deleting themselves
                throw new InvalidOperationException("Admin users cannot delete their own account.");
            }

            _context.Users.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
}
