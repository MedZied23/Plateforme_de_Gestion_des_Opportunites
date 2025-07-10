using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Cvs.Commands.DeleteCv
{
    public class DeleteCvCommandHandler : IRequestHandler<DeleteCvCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteCvCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteCvCommand request, CancellationToken cancellationToken)
        {
            var cv = await _context.Cvs
                .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

            if (cv == null)
            {
                return false;
            }

            _context.Cvs.Remove(cv);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}