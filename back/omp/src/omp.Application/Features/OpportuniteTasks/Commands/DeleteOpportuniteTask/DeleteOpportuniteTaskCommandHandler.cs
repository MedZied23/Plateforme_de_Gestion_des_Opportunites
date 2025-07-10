using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.OpportuniteTasks.Commands.DeleteOpportuniteTask
{
    public class DeleteOpportuniteTaskCommandHandler : IRequestHandler<DeleteOpportuniteTaskCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteOpportuniteTaskCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteOpportuniteTaskCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.OpportuniteTasks.FindAsync(request.Id);

            if (entity == null)
            {
                return false;
            }

            _context.OpportuniteTasks.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
