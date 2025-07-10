using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Users.Commands.UpdateUser
{
    public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UpdateUserCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Users.FindAsync(request.Id);
            
            if (entity == null) return false;

            // Update all properties including role
            entity.Nom = request.Nom;
            entity.Prenom = request.Prenom;
            entity.Email = request.Email;
            entity.Phone = request.Phone;
            entity.Role = request.Role;

            // Save all changes at once
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
