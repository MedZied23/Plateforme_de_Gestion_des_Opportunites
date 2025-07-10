using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using Konscious.Security.Cryptography;
using System.Security.Cryptography;

namespace omp.Infrastructure.Identity
{
    public class IdentityService : IIdentityService
    {
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public IdentityService(IApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<User> CreateUserAsync(string nom, string prenom, string email, string password, string phone, Role role)
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email == email))
                throw new InvalidOperationException("Email already registered");

            // Create new user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Nom = nom,
                Prenom = prenom,
                Email = email,
                Password = HashPassword(password),
                Phone = phone,
                Role = role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(CancellationToken.None);

            return user;
        }

        public async Task<bool> UpdateUserRoleAsync(Guid userId, Role newRole)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.Role = newRole;
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        public string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password using Argon2id
            using (var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password)))
            {
                argon2.Salt = salt;
                argon2.DegreeOfParallelism = 8; // Number of cores
                argon2.Iterations = 4; // Number of iterations
                argon2.MemorySize = 1024 * 64; // Memory size in KiB

                byte[] hash = argon2.GetBytes(32); // Hash length
                
                // Combine salt and hash for storage
                byte[] hashBytes = new byte[salt.Length + hash.Length];
                Array.Copy(salt, 0, hashBytes, 0, salt.Length);
                Array.Copy(hash, 0, hashBytes, salt.Length, hash.Length);

                // Convert to base64 for storage
                return Convert.ToBase64String(hashBytes);
            }
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            try
            {
                // Convert from base64
                byte[] hashBytes = Convert.FromBase64String(hashedPassword);

                // Extract salt and hash
                byte[] salt = new byte[32];
                byte[] hash = new byte[32];
                Array.Copy(hashBytes, 0, salt, 0, salt.Length);
                Array.Copy(hashBytes, salt.Length, hash, 0, hash.Length);

                // Create hash from password to test
                using (var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password)))
                {
                    argon2.Salt = salt;
                    argon2.DegreeOfParallelism = 8;
                    argon2.Iterations = 4;
                    argon2.MemorySize = 1024 * 64;

                    byte[] testHash = argon2.GetBytes(32);
                    return hash.SequenceEqual(testHash);
                }
            }
            catch
            {
                return false;
            }
        }

        public async Task<(bool isValid, User? user)> ValidateUserAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            
            if (user == null)
                return (false, null);

            var isValid = VerifyPassword(password, user.Password);
            return (isValid, isValid ? user : null);
        }

        public Task<string> GenerateJwtTokenAsync(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("nom", user.Nom),
                new Claim("prenom", user.Prenom)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(12),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return Task.FromResult(tokenHandler.WriteToken(token));
        }
    }
}