using System;
using MediatR;
using omp.Application.Features.Cvs.DTOs;

namespace omp.Application.Features.Cvs.Queries.GetCvById
{
    public class GetCvByIdQuery : IRequest<CvDto>
    {
        public Guid Id { get; set; }
    }
}