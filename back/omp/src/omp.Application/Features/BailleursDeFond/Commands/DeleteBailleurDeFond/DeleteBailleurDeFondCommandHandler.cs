using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.BailleursDeFond.Commands.DeleteBailleurDeFond
{
    public class DeleteBailleurDeFondCommandHandler : IRequestHandler<DeleteBailleurDeFondCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteBailleurDeFondCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteBailleurDeFondCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.BailleursDeFonds.FindAsync(request.Id);

            if (entity == null) return false;

            _context.BailleursDeFonds.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
}