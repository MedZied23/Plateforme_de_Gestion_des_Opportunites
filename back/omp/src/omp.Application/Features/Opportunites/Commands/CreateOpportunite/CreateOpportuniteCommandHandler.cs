using MediatR;
using omp.Domain.Entites;
using omp.Application.Common.Interfaces;
using omp.Application.Services;
using omp.Application.Features.Notifications.Commands.CreateNotification;
using omp.Application.Features.Users.Queries.GetUserById;

namespace omp.Application.Features.Opportunites.Commands.CreateOpportunite
{    public class CreateOpportuniteCommandHandler : IRequestHandler<CreateOpportuniteCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly IOpportuniteTaskService _taskService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMediator _mediator;

        public CreateOpportuniteCommandHandler(
            IApplicationDbContext context, 
            IOpportuniteTaskService taskService,
            ICurrentUserService currentUserService,
            IMediator mediator)
        {
            _context = context;
            _taskService = taskService;
            _currentUserService = currentUserService;
            _mediator = mediator;
        }        public async Task<Guid> Handle(CreateOpportuniteCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");
            var currentUserRole = _currentUserService.UserRole;
            
            // Enhanced role validation with better error messages
            if (currentUserRole == null)
            {
                Console.WriteLine($"[CreateOpportuniteCommandHandler] User {currentUserId} has null role - allowing creation temporarily for debugging");
                
                // TEMPORARY: Allow creation if role is null (for debugging purposes)
                // TODO: Remove this after role parsing is fixed
                Console.WriteLine("[CreateOpportuniteCommandHandler] WARNING: Bypassing role check due to null role");
            }
            else
            {
                // Check if user has permission to create opportunities
                // Only Manager, Senior Manager, Director, and Associé can create opportunities
                if (currentUserRole != Role.Manager && 
                    currentUserRole != Role.SeniorManager && 
                    currentUserRole != Role.Directeur && 
                    currentUserRole != Role.Associe)
                {
                    Console.WriteLine($"[CreateOpportuniteCommandHandler] User {currentUserId} with role {currentUserRole} denied opportunity creation");
                    throw new UnauthorizedAccessException($"You don't have permission to create opportunities. Only Manager, Senior Manager, Director, and Associé can create opportunities. Your current role: {currentUserRole}");
                }
                
                Console.WriteLine($"[CreateOpportuniteCommandHandler] User {currentUserId} with role {currentUserRole} authorized to create opportunity");
            }

            var now = DateTime.UtcNow;

            var entity = new Opportunite
            {
                Id = Guid.NewGuid(),
                NomOpportunite = request.NomOpportunite,
                ClientId = request.ClientId,
                PartnerExists = request.PartnerExists,
                PartenaireId = request.PartenaireId,
                Description = request.Description,
                Nature = request.Nature,
                Pays = request.Pays,
                DateDebut = request.DateDebut,
                DateFin = request.DateFin,
                Duree = request.Duree,
                BailleurExists = request.BailleurExists,
                IdBailleurDeFonds = request.IdBailleurDeFonds,
                Monnaie = request.Monnaie,                Offre = request.Offre,                AssocieEnCharge = request.AssocieEnCharge,
                SeniorManagerEnCharge = request.SeniorManagerEnCharge,
                ManagerEnCharge = request.ManagerEnCharge,
                CoManagerEnCharge = request.CoManagerEnCharge,
                EquipeProjet = request.EquipeProjet,
                IdPropositionFinanciere = request.IdPropositionFinanciere,
                Status = request.Status,
                LinkTeams1 = request.LinkTeams1,
                LinkTeams2 = request.LinkTeams2,
                LinkPropositionFinanciere = request.LinkPropositionFinanciere,

                // Audit fields
                DateCreated = now,
                CreatedBy = currentUserId,
                Commentaire = request.Commentaire
            };            _context.Opportunites.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            // Create tasks if Nature is AMI or Propale
            if (entity.Nature == Nature.AMI || entity.Nature == Nature.Propale)
            {
                await _taskService.CreateTasksForOpportunite(entity.Id, entity.Nature, entity.PartnerExists ?? false, cancellationToken);
            }

            // Send notification to team members
            await SendTeamNotificationAsync(entity, currentUserId, cancellationToken);            return entity.Id;
        }        private async Task SendTeamNotificationAsync(Opportunite opportunite, Guid currentUserId, CancellationToken cancellationToken)
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

            // Collect all team members
            var teamMembers = new List<Guid>();            // Add AssocieEnCharge if exists
            if (opportunite.AssocieEnCharge.HasValue)
            {
                teamMembers.Add(opportunite.AssocieEnCharge.Value);
            }            
            // Add SeniorManagerEnCharge if exists
            if (opportunite.SeniorManagerEnCharge.HasValue)
            {
                teamMembers.Add(opportunite.SeniorManagerEnCharge.Value);
            }

            // Add ManagerEnCharge if exists
            if (opportunite.ManagerEnCharge.HasValue)
            {
                teamMembers.Add(opportunite.ManagerEnCharge.Value);
            }

            // Add CoManagerEnCharge if exists
            if (opportunite.CoManagerEnCharge.HasValue)
            {
                teamMembers.Add(opportunite.CoManagerEnCharge.Value);
            }

            // Add EquipeProjet members if exists
            if (opportunite.EquipeProjet != null && opportunite.EquipeProjet.Any())
            {
                teamMembers.AddRange(opportunite.EquipeProjet);
            }

            // Remove duplicates and exclude the creator
            var recipients = teamMembers.Distinct().Where(id => id != currentUserId).ToList();

            // Only send notification if there are recipients
            if (recipients.Any())
            {
                // Determine the role of each recipient for the message body
                var roleMap = new Dictionary<Guid, string>();
                  if (opportunite.AssocieEnCharge.HasValue && recipients.Contains(opportunite.AssocieEnCharge.Value))
                {
                    roleMap[opportunite.AssocieEnCharge.Value] = "associé en charge";
                }
                
                if (opportunite.SeniorManagerEnCharge.HasValue && recipients.Contains(opportunite.SeniorManagerEnCharge.Value))
                {
                    roleMap[opportunite.SeniorManagerEnCharge.Value] = "senior manager en charge";
                }
                  
                if (opportunite.ManagerEnCharge.HasValue && recipients.Contains(opportunite.ManagerEnCharge.Value))
                {
                    roleMap[opportunite.ManagerEnCharge.Value] = "manager en charge";
                }
                
                if (opportunite.CoManagerEnCharge.HasValue && recipients.Contains(opportunite.CoManagerEnCharge.Value))
                {
                    roleMap[opportunite.CoManagerEnCharge.Value] = "co-manager en charge";
                }
                
                if (opportunite.EquipeProjet != null)
                {
                    foreach (var memberId in opportunite.EquipeProjet.Where(id => recipients.Contains(id) && !roleMap.ContainsKey(id)))
                    {
                        roleMap[memberId] = "membre équipe projet";
                    }
                }

                // Create individual notifications for each recipient with their specific role
                foreach (var recipientId in recipients)
                {
                    var role = roleMap.TryGetValue(recipientId, out var userRole) ? userRole : "membre équipe projet";
                      var notificationCommand = new CreateNotificationCommand
                    {
                        RecipientIds = new List<Guid> { recipientId },
                        SenderId = currentUserId,
                        Title = "Nouvelle opportunité : vous avez été ajouté(e) à une équipe",
                        Body = $"Vous avez été ajouté(e) à l'équipe de l'opportunité {opportunite.NomOpportunite} en tant que {role} par {creatorName}. Consultez les détails et collaborez avec votre équipe pour faire avancer ce projet.",
                        OpportuniteId = opportunite.Id,
                        PropositionFinanciereId = null
                    };

                    await _mediator.Send(notificationCommand, cancellationToken);
                }
            }
        }
    }
}
