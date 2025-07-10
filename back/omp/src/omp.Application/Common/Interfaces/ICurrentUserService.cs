using System;
using omp.Domain.Entites;

namespace omp.Application.Common.Interfaces
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }
        bool IsAuthenticated { get; }
        Role? UserRole { get; }
    }
}