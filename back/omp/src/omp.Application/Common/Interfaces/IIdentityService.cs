using omp.Domain.Entites;

namespace omp.Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<(bool isValid, User? user)> ValidateUserAsync(string email, string password);
        Task<string> GenerateJwtTokenAsync(User user);
        string HashPassword(string password);
        bool VerifyPassword(string password, string hashedPassword);
        Task<User> CreateUserAsync(string nom, string prenom, string email, string password, string phone, Role role);
        Task<bool> UpdateUserRoleAsync(Guid userId, Role newRole);
    }
}