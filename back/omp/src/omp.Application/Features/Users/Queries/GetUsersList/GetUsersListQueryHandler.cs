using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Application.Features.Users.Queries.GetUsersList
{
    public class GetUsersListQueryHandler : IRequestHandler<GetUsersListQuery, List<UserDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetUsersListQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }        public async Task<List<UserDto>> Handle(GetUsersListQuery request, CancellationToken cancellationToken)
        {
            return await _context.Users
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Nom = u.Nom,
                    Prenom = u.Prenom,
                    Email = u.Email,
                    Phone = u.Phone,
                    Role = u.Role
                })
                .ToListAsync(cancellationToken);
        }
    }
}
