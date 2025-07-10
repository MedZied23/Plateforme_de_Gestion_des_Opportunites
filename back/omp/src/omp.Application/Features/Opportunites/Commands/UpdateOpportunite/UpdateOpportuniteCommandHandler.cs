using MediatR;
using omp.Application.Common.Interfaces;
using omp.Application.Services;
using omp.Domain.Entites;
using System.Linq;
using omp.Application.Features.Notifications.Commands.CreateNotification;
using omp.Application.Features.Users.Queries.GetUserById;

namespace omp.Application.Features.Opportunites.Commands.UpdateOpportunite
{    public class UpdateOpportuniteCommandHandler : IRequestHandler<UpdateOpportuniteCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly IOpportuniteTaskService _taskService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMediator _mediator;

        public UpdateOpportuniteCommandHandler(
            IApplicationDbContext context, 
            IOpportuniteTaskService taskService,
            ICurrentUserService currentUserService,
            IMediator mediator)
        {
            _context = context;
            _taskService = taskService;
            _currentUserService = currentUserService;
            _mediator = mediator;        }public async Task<bool> Handle(UpdateOpportuniteCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");
            
            var entity = await _context.Opportunites.FindAsync(request.Id);

            if (entity == null)
            {
                return false;
            }

            // Check if user has permission to edit this opportunity
            // Only associé en charge, senior manager en charge, manager en charge, and co-manager en charge can edit
            bool canEdit = entity.AssocieEnCharge == currentUserId ||
                          entity.SeniorManagerEnCharge == currentUserId ||
                          entity.ManagerEnCharge == currentUserId ||
                          entity.CoManagerEnCharge == currentUserId;

            if (!canEdit)
            {
                throw new UnauthorizedAccessException("You don't have permission to edit this opportunity. Only associé en charge, senior manager en charge, manager en charge, and co-manager en charge can edit opportunities.");
            }            // Check if Nature is changing and requires task updates
            var oldNature = entity.Nature;
            var newNature = request.Nature;
            var natureChanged = oldNature != newNature;

            // Calculate the new PartnerExists value based on actual partner content
            bool hasValidPartners = request.PartenaireId != null && 
                                   request.PartenaireId.Count > 0 && 
                                   request.PartenaireId.Any(id => id != Guid.Empty);            // Check if PartnerExists is changing and requires BRIDGE task updates
            var oldPartnerExists = entity.PartnerExists ?? false;
            var newPartnerExists = hasValidPartners;
            var partnerExistsChanged = oldPartnerExists != newPartnerExists;

            // Check if Country is changing and requires Revue de Taxe task updates
            var oldCountry = entity.Pays;
            var newCountry = request.Pays;
            var countryChanged = oldCountry != newCountry;            // Detect new team members for notifications
            var oldTeamMembers = new List<Guid>();
            var newTeamMembers = new List<Guid>();            // Collect old team members
            if (entity.AssocieEnCharge.HasValue) oldTeamMembers.Add(entity.AssocieEnCharge.Value);
            if (entity.SeniorManagerEnCharge.HasValue) oldTeamMembers.Add(entity.SeniorManagerEnCharge.Value);
            if (entity.ManagerEnCharge.HasValue) oldTeamMembers.Add(entity.ManagerEnCharge.Value);
            if (entity.CoManagerEnCharge.HasValue) oldTeamMembers.Add(entity.CoManagerEnCharge.Value);
            if (entity.EquipeProjet != null) oldTeamMembers.AddRange(entity.EquipeProjet);

            // Collect new team members
            if (request.AssocieEnCharge.HasValue) newTeamMembers.Add(request.AssocieEnCharge.Value);
            if (request.SeniorManagerEnCharge.HasValue) newTeamMembers.Add(request.SeniorManagerEnCharge.Value);
            if (request.ManagerEnCharge.HasValue) newTeamMembers.Add(request.ManagerEnCharge.Value);
            if (request.CoManagerEnCharge.HasValue) newTeamMembers.Add(request.CoManagerEnCharge.Value);
            if (request.EquipeProjet != null) newTeamMembers.AddRange(request.EquipeProjet);

            // Find newly added team members (excluding the current user)
            var addedMembers = newTeamMembers.Distinct()
                .Where(id => !oldTeamMembers.Contains(id) && id != currentUserId)
                .ToList();

            entity.NomOpportunite = request.NomOpportunite;
            entity.ClientId = request.ClientId;
            entity.PartenaireId = request.PartenaireId;
            
            // Set PartnerExists based on the calculated value
            entity.PartnerExists = hasValidPartners;
            
            entity.Description = request.Description;
            entity.Nature = request.Nature;
            entity.Pays = request.Pays;
            entity.DateDebut = request.DateDebut;
            entity.DateFin = request.DateFin;
            entity.Duree = request.Duree;
            entity.BailleurExists = request.BailleurExists;            entity.IdBailleurDeFonds = request.IdBailleurDeFonds;
            entity.Monnaie = request.Monnaie;
            entity.Offre = request.Offre;            entity.AssocieEnCharge = request.AssocieEnCharge;
            entity.SeniorManagerEnCharge = request.SeniorManagerEnCharge;
            entity.ManagerEnCharge = request.ManagerEnCharge;
            entity.CoManagerEnCharge = request.CoManagerEnCharge;
            entity.EquipeProjet = request.EquipeProjet;
            entity.IdPropositionFinanciere = request.IdPropositionFinanciere;            entity.Status = request.Status;
            entity.LinkTeams1 = request.LinkTeams1;
            entity.LinkTeams2 = request.LinkTeams2;
            entity.LinkPropositionFinanciere = request.LinkPropositionFinanciere;

            // Update audit fields
            entity.LastModified = DateTime.UtcNow;
            entity.LastModifiedBy = _currentUserService.UserId;
            entity.Commentaire = request.Commentaire;
            await _context.SaveChangesAsync(cancellationToken);

            // Handle task updates if Nature changed
            if (natureChanged)
            {
                await _taskService.UpdateTasksForOpportuniteNatureChange(entity.Id, newNature, cancellationToken);
            }            // Handle BRIDGE task updates if PartnerExists changed
            if (partnerExistsChanged)
            {
                await _taskService.HandlePartnerExistsChange(entity.Id, oldPartnerExists, newPartnerExists, cancellationToken);
            }

            // Handle Revue de Taxe task updates if Country changed
            if (countryChanged)
            {
                await _taskService.HandleCountryChange(entity.Id, oldCountry, newCountry, cancellationToken);
            }

            // Send notifications to newly added team members
            if (addedMembers.Any())
            {
                await SendNewTeamMemberNotificationAsync(entity, addedMembers, currentUserId, cancellationToken);
            }            return true;
        }

        private async Task SendNewTeamMemberNotificationAsync(Opportunite opportunite, List<Guid> newMemberIds, Guid currentUserId, CancellationToken cancellationToken)
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

            // Determine the role of each new member for the message body
            var roleMap = new Dictionary<Guid, string>();
            
            foreach (var memberId in newMemberIds)
            {                if (opportunite.AssocieEnCharge == memberId)
                {
                    roleMap[memberId] = "associé en charge";
                }
                else if (opportunite.SeniorManagerEnCharge == memberId)
                {
                    roleMap[memberId] = "senior manager en charge";
                }
                else if (opportunite.ManagerEnCharge == memberId)
                {
                    roleMap[memberId] = "manager en charge";
                }
                else if (opportunite.CoManagerEnCharge == memberId)
                {
                    roleMap[memberId] = "co-manager en charge";
                }
                else if (opportunite.EquipeProjet != null && opportunite.EquipeProjet.Contains(memberId))
                {
                    roleMap[memberId] = "membre équipe projet";
                }
                else
                {
                    roleMap[memberId] = "membre équipe projet"; // Default
                }
            }

            // Create individual notifications for each new team member
            foreach (var memberId in newMemberIds)
            {
                var role = roleMap.TryGetValue(memberId, out var userRole) ? userRole : "membre équipe projet";
                
                var notificationCommand = new CreateNotificationCommand
                {
                    RecipientIds = new List<Guid> { memberId },
                    SenderId = currentUserId,
                    Title = "Opportunité mise à jour : vous avez été ajouté(e) à une équipe",
                    Body = $"Vous avez été ajouté(e) à l'équipe de l'opportunité {opportunite.NomOpportunite} en tant que {role} par {updaterName}. Consultez les détails et collaborez avec votre équipe pour faire avancer ce projet.",
                    OpportuniteId = opportunite.Id,
                    PropositionFinanciereId = null
                };

                await _mediator.Send(notificationCommand, cancellationToken);
            }
        }
    }
}
