using MediatR;
using omp.Domain.Entites;
using omp.Application.Common.Interfaces;

namespace omp.Application.Features.Notifications.Commands.CreateNotification
{
    public class CreateNotificationCommandHandler : IRequestHandler<CreateNotificationCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateNotificationCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateNotificationCommand request, CancellationToken cancellationToken)
        {
            var entity = new Notification
            {
                Id = Guid.NewGuid(),
                RecipientIds = request.RecipientIds,
                SenderId = request.SenderId,
                Title = request.Title,
                Body = request.Body,
                DateSent = DateTime.UtcNow,
                Read = false,
                DateRead = null,
                OpportuniteId = request.OpportuniteId,
                PropositionFinanciereId = request.PropositionFinanciereId
            };

            _context.Notifications.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}
