using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Opportunites.Commands.DeleteOpportunite
{
    public class DeleteOpportuniteCommandHandler : IRequestHandler<DeleteOpportuniteCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public DeleteOpportuniteCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<bool> Handle(DeleteOpportuniteCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");
            
            var entity = await _context.Opportunites.FindAsync(request.Id);
            
            if (entity == null) return false;

            // Check if user has permission to delete this opportunity
            // Only associé en charge, senior manager en charge, manager en charge, and co-manager en charge can delete
            bool canDelete = entity.AssocieEnCharge == currentUserId ||
                            entity.SeniorManagerEnCharge == currentUserId ||
                            entity.ManagerEnCharge == currentUserId ||
                            entity.CoManagerEnCharge == currentUserId;

            if (!canDelete)
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this opportunity. Only associé en charge, senior manager en charge, manager en charge, and co-manager en charge can delete opportunities.");
            }

            _context.Opportunites.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
}
