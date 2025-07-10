using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;

namespace omp.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid? UserId
        {
            get
            {
                var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
            }
        }

        public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;        public Role? UserRole
        {
            get
            {
                try
                {
                    var roleClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
                    
                    if (string.IsNullOrEmpty(roleClaim))
                    {
                        Console.WriteLine($"[CurrentUserService] No role claim found for user: {UserId}");
                        return null;
                    }

                    // Try parsing as enum name first
                    if (Enum.TryParse<Role>(roleClaim, true, out var role))
                    {
                        Console.WriteLine($"[CurrentUserService] Parsed role '{roleClaim}' as {role} for user: {UserId}");
                        return role;
                    }

                    // Try parsing as integer
                    if (int.TryParse(roleClaim, out var roleInt) && Enum.IsDefined(typeof(Role), roleInt))
                    {
                        role = (Role)roleInt;
                        Console.WriteLine($"[CurrentUserService] Parsed role number '{roleClaim}' as {role} for user: {UserId}");
                        return role;
                    }

                    Console.WriteLine($"[CurrentUserService] Failed to parse role '{roleClaim}' for user: {UserId}");
                    return null;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CurrentUserService] Exception parsing role for user {UserId}: {ex.Message}");
                    return null;
                }
            }
        }
    }
}
