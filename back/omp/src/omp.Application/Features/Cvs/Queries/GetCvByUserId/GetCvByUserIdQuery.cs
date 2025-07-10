using System;
using MediatR;
using omp.Application.Features.Cvs.DTOs;

namespace omp.Application.Features.Cvs.Queries.GetCvByUserId
{
    public class GetCvByUserIdQuery : IRequest<CvDto>
    {
        public Guid UserId { get; set; }
    }
}
