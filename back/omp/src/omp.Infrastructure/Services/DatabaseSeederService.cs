using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Infrastructure.Services
{
    public class DatabaseSeederService
    {
        private readonly IApplicationDbContext _context;
        private readonly IIdentityService _identityService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DatabaseSeederService> _logger;

        public DatabaseSeederService(
            IApplicationDbContext context,
            IIdentityService identityService,
            IConfiguration configuration,
            ILogger<DatabaseSeederService> logger)
        {
            _context = context;
            _identityService = identityService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            try
            {
                await SeedAdminUserAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while seeding the database");
                throw;
            }
        }

        private async Task SeedAdminUserAsync()
        {
            // Check if any admin users already exist
            var adminExists = await _context.Users
                .AnyAsync(u => u.Role == Role.Admin);

            if (!adminExists)
            {
                _logger.LogInformation("No admin users found. Creating default admin user...");

                // Get admin user details from configuration or use defaults
                var adminEmail = _configuration["DefaultAdmin:Email"] ?? "admin@omp.com";
                var adminPassword = _configuration["DefaultAdmin:Password"] ?? "Admin@123";
                var adminFirstName = _configuration["DefaultAdmin:FirstName"] ?? "Admin";
                var adminLastName = _configuration["DefaultAdmin:LastName"] ?? "User";
                var adminPhone = _configuration["DefaultAdmin:Phone"] ?? "+1234567890";

                try
                {
                    var adminUser = await _identityService.CreateUserAsync(
                        nom: adminLastName,
                        prenom: adminFirstName,
                        email: adminEmail,
                        password: adminPassword,
                        phone: adminPhone,
                        role: Role.Admin
                    );

                    _logger.LogInformation("Default admin user created successfully with email: {Email}", adminEmail);
                    _logger.LogWarning("IMPORTANT: Please change the default admin password after first login!");
                }
                catch (InvalidOperationException ex) when (ex.Message.Contains("Email already registered"))
                {
                    _logger.LogWarning("Admin user with email {Email} already exists", adminEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create default admin user");
                    throw;
                }
            }
            else
            {
                _logger.LogInformation("Admin user(s) already exist. Skipping admin user creation.");
            }
        }
    }
}
