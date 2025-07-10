using MediatR;
using omp.Domain.Entites;

namespace omp.Application.Features.Users.Queries.GetUserById
{
    public class GetUserByIdQuery : IRequest<UserDetailDto>
    {
        public Guid Id { get; set; }
    }    public class UserDetailDto
    {
        public Guid Id { get; set; }
        public required string Nom { get; set; }
        public required string Prenom { get; set; }
        public required string Email { get; set; }
        public required string Phone { get; set; }
        public Role Role { get; set; }
    }
}
