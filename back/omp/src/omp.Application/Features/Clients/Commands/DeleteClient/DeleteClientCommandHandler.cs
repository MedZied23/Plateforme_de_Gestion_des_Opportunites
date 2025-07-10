using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Clients.Commands.DeleteClient
{
    public class DeleteClientCommandHandler : IRequestHandler<DeleteClientCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteClientCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteClientCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Clients.FindAsync(request.Id);
            
            if (entity == null) return false;

            _context.Clients.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
}
