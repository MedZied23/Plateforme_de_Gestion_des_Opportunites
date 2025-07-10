using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using omp.Application.Features.Notifications.Commands.CreateNotification;
using omp.Application.Features.Users.Queries.GetUserById;

namespace omp.Application.Features.OpportuniteTasks.Commands.CreateOpportuniteTask
{
    public class CreateOpportuniteTaskCommandHandler : IRequestHandler<CreateOpportuniteTaskCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMediator _mediator;

        public CreateOpportuniteTaskCommandHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUserService,
            IMediator mediator)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mediator = mediator;
        }public async Task<Guid> Handle(CreateOpportuniteTaskCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");

            // Auto-assign numero based on task type and nature
            int? assignedNumero = null;
            if (request.Type.HasValue)
            {
                assignedNumero = await GetNextNumeroAsync(request.OpportuniteId, request.Type.Value, request.Nature, cancellationToken);
            }            var entity = new OpportuniteTask
            {
                Id = Guid.NewGuid(),
                OpportuniteId = request.OpportuniteId,
                Name = null, // Name is not provided from frontend, using NewName instead
                NewName = request.NewName,
                Type = request.Type,
                Equipe = request.Equipe ?? new Dictionary<Guid, bool>(),
                DateAssigned = null, // Will be set automatically when team is assigned
                DateDone = request.DateDone,
                Percentage = request.Percentage,
                Numero = assignedNumero,
                Done = request.Done ?? false,
                Nature = request.Nature,
                Statut = request.Statut
            };

            // Auto-set DateAssigned if team members are assigned
            if (entity.Equipe != null && entity.Equipe.Any())
            {
                entity.DateAssigned = DateTime.UtcNow;
            }
            
            // Update Done status based on team completion
            entity.UpdateDoneStatus();_context.OpportuniteTasks.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);            // Send notifications to team members if task is assigned to team
            if (entity.Equipe != null && entity.Equipe.Any())
            {
                var teamMembersToNotify = entity.Equipe.Keys.Where(id => id != currentUserId).ToList();
                if (teamMembersToNotify.Any())
                {
                    await SendTaskCreationNotificationAsync(entity, teamMembersToNotify, currentUserId, cancellationToken);
                }
            }

            return entity.Id;
        }        private async Task<int> GetNextNumeroAsync(Guid? opportuniteId, TaskType taskType, Nature? nature, CancellationToken cancellationToken)
        {
            if (taskType == TaskType.Administrative)
            {
                // For administrative tasks, get the highest numero among all administrative tasks for this opportunite
                var adminTasks = await _context.OpportuniteTasks
                    .Where(t => t.OpportuniteId == opportuniteId && 
                               t.Type == TaskType.Administrative && 
                               t.Numero != null)
                    .Select(t => t.Numero!.Value)
                    .ToListAsync(cancellationToken);

                return adminTasks.Count > 0 ? adminTasks.Max() + 1 : 1;
            }
            else if (taskType == TaskType.Operational)
            {
                // For operational tasks, get the highest numero among operational tasks of the same nature for this opportunite
                var operationalTasks = await _context.OpportuniteTasks
                    .Where(t => t.OpportuniteId == opportuniteId && 
                               t.Type == TaskType.Operational && 
                               t.Nature == nature && 
                               t.Numero != null)
                    .Select(t => t.Numero!.Value)
                    .ToListAsync(cancellationToken);

                return operationalTasks.Count > 0 ? operationalTasks.Max() + 1 : 1;
            }

            // Default fallback
            return 1;
        }

        private async Task SendTaskCreationNotificationAsync(OpportuniteTask task, List<Guid> teamMemberIds, Guid currentUserId, CancellationToken cancellationToken)
        {
            // Get creator's name for the notification message
            string creatorName = "un utilisateur"; // Default fallback
            try
            {
                var creatorQuery = new GetUserByIdQuery { Id = currentUserId };
                var creator = await _mediator.Send(creatorQuery, cancellationToken);
                if (creator != null && !string.IsNullOrEmpty(creator.Nom))
                {
                    creatorName = !string.IsNullOrEmpty(creator.Prenom) 
                        ? $"{creator.Prenom} {creator.Nom}" 
                        : creator.Nom;
                }
            }
            catch
            {
                // Keep default fallback if user lookup fails
            }

            // Create individual notifications for each team member
            foreach (var memberId in teamMemberIds)
            {
                var taskName = !string.IsNullOrEmpty(task.NewName) ? task.NewName : task.Name?.ToString() ?? "Tâche";
                var deadlineText = task.DateDone.HasValue ? $" avec une échéance le {task.DateDone.Value:dd/MM/yyyy}" : "";
                var assignmentDateText = task.DateAssigned.HasValue ? $" le {task.DateAssigned.Value:dd/MM/yyyy}" : "";
                
                var notificationCommand = new CreateNotificationCommand
                {
                    RecipientIds = new List<Guid> { memberId },
                    SenderId = currentUserId,
                    Title = "Nouvelle tâche assignée",
                    Body = $"Une nouvelle tâche \"{taskName}\" vous a été assignée{assignmentDateText} par {creatorName}.{deadlineText}",
                    OpportuniteId = task.OpportuniteId,
                    PropositionFinanciereId = null
                };

                await _mediator.Send(notificationCommand, cancellationToken);
            }
        }
    }
}
