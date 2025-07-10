using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.References.Commands.DeleteReference
{
    public class DeleteReferenceCommandHandler : IRequestHandler<DeleteReferenceCommand, Unit>
    {
        private readonly IApplicationDbContext _context;

        public DeleteReferenceCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Unit> Handle(DeleteReferenceCommand request, CancellationToken cancellationToken)
        {
            var reference = await _context.References
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

            if (reference == null)
            {
                throw new Exception($"Reference with ID {request.Id} not found");
            }

            _context.References.Remove(reference);
            await _context.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}