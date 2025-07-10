using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.References.DTOs;

namespace omp.Application.Features.References.Queries.GetReferenceById
{
    public class GetReferenceByIdQueryHandler : IRequestHandler<GetReferenceByIdQuery, ReferenceDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetReferenceByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ReferenceDto> Handle(GetReferenceByIdQuery request, CancellationToken cancellationToken)
        {
            var reference = await _context.References
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);            if (reference == null)
            {
                throw new Exception($"Reference with ID {request.Id} not found");
            }

            // Update LastAccessed time when Reference is retrieved
            reference.LastAccessed = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            return _mapper.Map<ReferenceDto>(reference);
        }
    }
}