using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.OpportuniteTasks.DTOs;

namespace omp.Application.Features.OpportuniteTasks.Queries.GetOpportuniteTasksByOpportuniteId
{
    public class GetOpportuniteTasksByOpportuniteIdQueryHandler : IRequestHandler<GetOpportuniteTasksByOpportuniteIdQuery, List<OpportuniteTaskDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetOpportuniteTasksByOpportuniteIdQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }        public async Task<List<OpportuniteTaskDto>> Handle(GetOpportuniteTasksByOpportuniteIdQuery request, CancellationToken cancellationToken)
        {
            return await _context.OpportuniteTasks
                .Where(t => t.OpportuniteId == request.OpportuniteId)
                .OrderBy(t => t.Numero)                .Select(t => new OpportuniteTaskDto
                {
                    Id = t.Id,
                    OpportuniteId = t.OpportuniteId,
                    Name = t.Name,
                    NewName = t.NewName,
                    Type = t.Type,
                    Equipe = t.Equipe,
                    DateAssigned = t.DateAssigned,
                    DateDone = t.DateDone,
                    Percentage = t.Percentage,
                    Numero = t.Numero,
                    Done = t.Done,
                    Nature = t.Nature,
                    Statut = t.Statut
                })
                .ToListAsync(cancellationToken);
        }
    }
}