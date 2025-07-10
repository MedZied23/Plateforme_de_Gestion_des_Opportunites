using MediatR;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Partenaires.Commands.DeletePartenaire
{
    public class DeletePartenaireCommandHandler : IRequestHandler<DeletePartenaireCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeletePartenaireCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeletePartenaireCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Partenaires.FindAsync(request.Id);
            
            if (entity == null) return false;

            _context.Partenaires.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
}
