using System;
using MediatR;
using omp.Application.Features.Profils.DTOs;

namespace omp.Application.Features.Profils.Queries.GetProfilById
{
    public class GetProfilByIdQuery : IRequest<ProfilDto>
    {
        public Guid Id { get; set; }
    }
}