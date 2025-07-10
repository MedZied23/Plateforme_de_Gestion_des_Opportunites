using MediatR;
using omp.Application.Common.Interfaces;
using System.Linq;
using omp.Application.Features.Notifications.Commands.CreateNotification;
using omp.Application.Features.Users.Queries.GetUserById;

namespace omp.Application.Features.OpportuniteTasks.Commands.UpdateOpportuniteTask
{
    public class UpdateOpportuniteTaskCommandHandler : IRequestHandler<UpdateOpportuniteTaskCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMediator _mediator;

        public UpdateOpportuniteTaskCommandHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUserService,
            IMediator mediator)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mediator = mediator;
        }        public async Task<bool> Handle(UpdateOpportuniteTaskCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.OpportuniteTasks.FindAsync(request.Id);

            if (entity == null)
            {
                return false;
            }
            
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");
            
            // Check if this is the first assignment to the team
            bool wasTeamEmpty = entity.Equipe == null || !entity.Equipe.Any();
            bool willHaveTeamMembers = request.Equipe != null && request.Equipe.Any();
              // Track team changes for notifications
            var oldTeamMembers = entity.Equipe?.Keys.ToList() ?? new List<Guid>();
            var newTeamMembers = request.Equipe?.Keys.ToList() ?? new List<Guid>();
            
            // Track DateDone changes for notifications
            var oldDateDone = entity.DateDone;
            var newDateDone = request.DateDone;
            bool dateDeadlineChanged = oldDateDone != newDateDone;
            
            entity.OpportuniteId = request.OpportuniteId;
            entity.Name = request.Name;
            entity.NewName = request.NewName;
            entity.Type = request.Type;
            entity.Equipe = request.Equipe;            // Auto-set DateAssigned when first team member is assigned
            if (wasTeamEmpty && willHaveTeamMembers && !entity.DateAssigned.HasValue)
            {
                entity.DateAssigned = DateTime.UtcNow;
            }
            else
            {
                entity.DateAssigned = request.DateAssigned;
            }            entity.DateDone = request.DateDone;
            entity.Percentage = request.Percentage;
            entity.Numero = request.Numero;
            
            // Store original Done status to detect manual changes
            bool originalDoneStatus = entity.Done ?? false;
            entity.Done = request.Done;
            entity.Statut = request.Statut;
            
            // Check if this is a manual manager override (Done status changed but team didn't change)
            bool teamCompositionChanged = !oldTeamMembers.SequenceEqual(newTeamMembers);
            bool individualCompletionChanged = !teamCompositionChanged && 
                                               entity.Equipe != null && request.Equipe != null &&
                                               entity.Equipe.Any(kvp => request.Equipe.ContainsKey(kvp.Key) && request.Equipe[kvp.Key] != kvp.Value);
            bool manualDoneToggle = !teamCompositionChanged && !individualCompletionChanged && (originalDoneStatus != (request.Done ?? false));
            
            if (manualDoneToggle && (request.Done ?? false) && entity.Equipe != null && entity.Equipe.Any())
            {
                // Manager manually marked task as done - mark all team members as completed
                var updatedEquipe = new Dictionary<Guid, bool>();
                foreach (var member in entity.Equipe)
                {
                    updatedEquipe[member.Key] = true;
                }
                entity.Equipe = updatedEquipe;
            }
            else if (manualDoneToggle && !(request.Done ?? false) && entity.Equipe != null && entity.Equipe.Any())
            {
                // Manager manually marked task as not done - mark all team members as not completed
                var updatedEquipe = new Dictionary<Guid, bool>();
                foreach (var member in entity.Equipe)
                {
                    updatedEquipe[member.Key] = false;
                }
                entity.Equipe = updatedEquipe;
            }
            else if (teamCompositionChanged || individualCompletionChanged)
            {
                // Only update Done status based on team completion if team/individual completions changed
                entity.UpdateDoneStatus();
            }
            
            // Only update Nature if it's explicitly provided (not null)
            // This prevents overwriting existing Nature values during user assignment operations
            if (request.Nature.HasValue)
            {
                entity.Nature = request.Nature;
            }            await _context.SaveChangesAsync(cancellationToken);
            
            // Handle notifications intelligently - combine when both team and deadline change
            var addedMembers = newTeamMembers.Where(id => !oldTeamMembers.Contains(id) && id != currentUserId).ToList();
            var existingTeamMembersToNotify = newTeamMembers.Where(id => oldTeamMembers.Contains(id) && id != currentUserId).ToList();
            
            // If both team members are added AND deadline changed, send combined notification to new members
            if (addedMembers.Any() && dateDeadlineChanged)
            {
                await SendCombinedAssignmentAndDeadlineNotificationAsync(entity, addedMembers, currentUserId, oldDateDone, newDateDone, cancellationToken);
                
                // Send deadline-only notification to existing team members (if any)
                if (existingTeamMembersToNotify.Any())
                {
                    await SendDeadlineChangeNotificationAsync(entity, existingTeamMembersToNotify, currentUserId, oldDateDone, newDateDone, cancellationToken);
                }
            }
            // If only team members are added (no deadline change)
            else if (addedMembers.Any())
            {
                await SendTaskAssignmentNotificationAsync(entity, addedMembers, currentUserId, cancellationToken);
            }
            // If only deadline changed (no new team members)
            else if (dateDeadlineChanged && newTeamMembers.Any())
            {
                var teamMembersToNotify = newTeamMembers.Where(id => id != currentUserId).ToList();
                if (teamMembersToNotify.Any())
                {
                    await SendDeadlineChangeNotificationAsync(entity, teamMembersToNotify, currentUserId, oldDateDone, newDateDone, cancellationToken);
                }
            }
            
            return true;
        }

        private async Task SendTaskAssignmentNotificationAsync(Domain.Entites.OpportuniteTask task, List<Guid> newMemberIds, Guid currentUserId, CancellationToken cancellationToken)
        {
            // Get assigner's name for the notification message
            string assignerName = "un utilisateur"; // Default fallback
            try
            {
                var assignerQuery = new GetUserByIdQuery { Id = currentUserId };
                var assigner = await _mediator.Send(assignerQuery, cancellationToken);
                if (assigner != null && !string.IsNullOrEmpty(assigner.Nom))
                {
                    assignerName = !string.IsNullOrEmpty(assigner.Prenom) 
                        ? $"{assigner.Prenom} {assigner.Nom}" 
                        : assigner.Nom;
                }
            }
            catch
            {
                // Keep default fallback if user lookup fails
            }

            // Create individual notifications for each new team member
            foreach (var memberId in newMemberIds)
            {
                var taskName = !string.IsNullOrEmpty(task.NewName) ? task.NewName : task.Name?.ToString() ?? "Tâche";
                var deadlineText = task.DateDone.HasValue ? $" avec une échéance le {task.DateDone.Value:dd/MM/yyyy}" : "";
                var assignmentDateText = task.DateAssigned.HasValue ? $" le {task.DateAssigned.Value:dd/MM/yyyy}" : "";
                
                var notificationCommand = new CreateNotificationCommand
                {
                    RecipientIds = new List<Guid> { memberId },
                    SenderId = currentUserId,
                    Title = "Nouvelle assignation de tâche",
                    Body = $"Vous avez été assigné(e) à la tâche \"{taskName}\"{assignmentDateText} par {assignerName}.{deadlineText}",
                    OpportuniteId = task.OpportuniteId,
                    PropositionFinanciereId = null
                };

                await _mediator.Send(notificationCommand, cancellationToken);
            }
        }

        private async Task SendDeadlineChangeNotificationAsync(Domain.Entites.OpportuniteTask task, List<Guid> teamMemberIds, Guid currentUserId, DateTime? oldDeadline, DateTime? newDeadline, CancellationToken cancellationToken)
        {
            // Get updater's name for the notification message
            string updaterName = "un utilisateur"; // Default fallback
            try
            {
                var updaterQuery = new GetUserByIdQuery { Id = currentUserId };
                var updater = await _mediator.Send(updaterQuery, cancellationToken);
                if (updater != null && !string.IsNullOrEmpty(updater.Nom))
                {
                    updaterName = !string.IsNullOrEmpty(updater.Prenom) 
                        ? $"{updater.Prenom} {updater.Nom}" 
                        : updater.Nom;
                }
            }
            catch
            {
                // Keep default fallback if user lookup fails
            }

            // Determine the type of deadline change
            string deadlineChangeText;
            string title;
            
            if (!oldDeadline.HasValue && newDeadline.HasValue)
            {
                // Deadline was added
                deadlineChangeText = $"Une échéance a été ajoutée : {newDeadline.Value:dd/MM/yyyy}";
                title = "Échéance ajoutée à votre tâche";
            }
            else if (oldDeadline.HasValue && !newDeadline.HasValue)
            {
                // Deadline was removed
                deadlineChangeText = "L'échéance a été supprimée";
                title = "Échéance supprimée de votre tâche";
            }
            else if (oldDeadline.HasValue && newDeadline.HasValue)
            {
                // Deadline was changed
                deadlineChangeText = $"L'échéance a été modifiée de {oldDeadline.Value:dd/MM/yyyy} à {newDeadline.Value:dd/MM/yyyy}";
                title = "Échéance modifiée pour votre tâche";
            }
            else
            {
                // Should not happen, but just in case
                return;
            }

            // Create individual notifications for each team member
            foreach (var memberId in teamMemberIds)
            {
                var taskName = !string.IsNullOrEmpty(task.NewName) ? task.NewName : task.Name?.ToString() ?? "Tâche";
                
                var notificationCommand = new CreateNotificationCommand
                {
                    RecipientIds = new List<Guid> { memberId },
                    SenderId = currentUserId,
                    Title = title,
                    Body = $"{deadlineChangeText} pour la tâche \"{taskName}\" par {updaterName}.",
                    OpportuniteId = task.OpportuniteId,
                    PropositionFinanciereId = null
                };

                await _mediator.Send(notificationCommand, cancellationToken);
            }
        }

        private async Task SendCombinedAssignmentAndDeadlineNotificationAsync(Domain.Entites.OpportuniteTask task, List<Guid> newMemberIds, Guid currentUserId, DateTime? oldDeadline, DateTime? newDeadline, CancellationToken cancellationToken)
        {
            // Get assigner's name for the notification message
            string assignerName = "un utilisateur"; // Default fallback
            try
            {
                var assignerQuery = new GetUserByIdQuery { Id = currentUserId };
                var assigner = await _mediator.Send(assignerQuery, cancellationToken);
                if (assigner != null && !string.IsNullOrEmpty(assigner.Nom))
                {
                    assignerName = !string.IsNullOrEmpty(assigner.Prenom) 
                        ? $"{assigner.Prenom} {assigner.Nom}" 
                        : assigner.Nom;
                }
            }
            catch
            {
                // Keep default fallback if user lookup fails
            }

            // Create individual notifications for each new team member with combined message
            foreach (var memberId in newMemberIds)
            {
                var taskName = !string.IsNullOrEmpty(task.NewName) ? task.NewName : task.Name?.ToString() ?? "Tâche";
                var assignmentDateText = task.DateAssigned.HasValue ? $" le {task.DateAssigned.Value:dd/MM/yyyy}" : "";
                
                // Determine deadline change text
                string deadlineText = "";
                if (!oldDeadline.HasValue && newDeadline.HasValue)
                {
                    deadlineText = $" avec une échéance fixée au {newDeadline.Value:dd/MM/yyyy}";
                }
                else if (oldDeadline.HasValue && !newDeadline.HasValue)
                {
                    deadlineText = " (l'échéance précédente a été supprimée)";
                }
                else if (oldDeadline.HasValue && newDeadline.HasValue)
                {
                    deadlineText = $" avec une échéance modifiée au {newDeadline.Value:dd/MM/yyyy}";
                }
                
                var notificationCommand = new CreateNotificationCommand
                {
                    RecipientIds = new List<Guid> { memberId },
                    SenderId = currentUserId,
                    Title = "Nouvelle assignation de tâche",
                    Body = $"Vous avez été assigné(e) à la tâche \"{taskName}\"{assignmentDateText} par {assignerName}.{deadlineText}",
                    OpportuniteId = task.OpportuniteId,
                    PropositionFinanciereId = null
                };

                await _mediator.Send(notificationCommand, cancellationToken);
            }
        }
    }
}