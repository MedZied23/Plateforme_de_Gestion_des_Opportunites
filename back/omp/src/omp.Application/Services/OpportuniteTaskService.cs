using omp.Domain.Entites;
using omp.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace omp.Application.Services
{    public interface IOpportuniteTaskService
    {
        Task CreateTasksForOpportunite(Guid opportuniteId, Nature? nature, bool partnerExists = false, CancellationToken cancellationToken = default);
        Task UpdateTasksForOpportuniteNatureChange(Guid opportuniteId, Nature? newNature, CancellationToken cancellationToken = default);
        Task HandlePartnerExistsChange(Guid opportuniteId, bool oldPartnerExists, bool newPartnerExists, CancellationToken cancellationToken = default);
        Task HandleCountryChange(Guid opportuniteId, string? oldCountry, string? newCountry, CancellationToken cancellationToken = default);
    }

    public class OpportuniteTaskService : IOpportuniteTaskService
    {
        private readonly IApplicationDbContext _context;

        public OpportuniteTaskService(IApplicationDbContext context)
        {
            _context = context;
        }        public async Task CreateTasksForOpportunite(Guid opportuniteId, Nature? nature, bool partnerExists = false, CancellationToken cancellationToken = default)
        {
            // Get the opportunity to access its country information
            var opportunite = await _context.Opportunites
                .Where(o => o.Id == opportuniteId)
                .Select(o => new { o.Pays })
                .FirstOrDefaultAsync(cancellationToken);

            // Create administrative tasks - conditionally create BRIDGE task based on partner existence
            var adminTasks = new List<TaskName> { TaskName.CreationSurCRM, TaskName.PACE };
            if (partnerExists)
            {
                adminTasks.Add(TaskName.BRIDGE);
            }

            // Add "Revue de Taxe" task only if the country is NOT Tunisia
            if (opportunite != null && !IsTunisia(opportunite.Pays))
            {
                adminTasks.Add(TaskName.RevueDeTaxe);
            }
            
            var adminNumero = 1;foreach (var taskName in adminTasks)
            {var task = new OpportuniteTask
                {
                    Id = Guid.NewGuid(),
                    OpportuniteId = opportuniteId,
                    Name = taskName,
                    NewName = null, // Default to null for auto-generated tasks
                    Type = TaskType.Administrative,
                    Percentage = null,
                    Numero = adminNumero++,
                    Equipe = null,
                    DateAssigned = null,
                    DateDone = null,
                    Done = false,
                    Nature = null, // Administrative tasks have no nature
                    Statut = StatutTache.NotStarted // Default status
                };

                _context.OpportuniteTasks.Add(task);
            }

            // Create operational tasks based on nature
            if (nature != null && (nature == Nature.AMI || nature == Nature.Propale))
            {
                if (TaskNamePercentage.Percentages.ContainsKey(nature.Value))
                {
                    var taskDefinitions = TaskNamePercentage.Percentages[nature.Value];
                    var operationalNumero = 1;                    foreach (var taskDefinition in taskDefinitions)
                    {                        var task = new OpportuniteTask
                        {
                            Id = Guid.NewGuid(),
                            OpportuniteId = opportuniteId,
                            Name = taskDefinition.Key,
                            NewName = null, // Default to null for auto-generated tasks
                            Type = TaskType.Operational,
                            Percentage = taskDefinition.Value,
                            Numero = operationalNumero++,
                            Equipe = new Dictionary<Guid, bool>(),
                            Done = false,
                            Nature = nature, // Set the task's nature based on the opportunite's nature
                            Statut = StatutTache.NotStarted // Default status
                        };

                        _context.OpportuniteTasks.Add(task);
                    }
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateTasksForOpportuniteNatureChange(Guid opportuniteId, Nature? newNature, CancellationToken cancellationToken = default)
        {
            // Get existing operational tasks for all natures
            var existingOperationalTasks = await _context.OpportuniteTasks
                .Where(t => t.OpportuniteId == opportuniteId && t.Type == TaskType.Operational)
                .ToListAsync(cancellationToken);

            // If switching to non-AMI/Propale state, remove all operational tasks
            if (newNature != Nature.AMI && newNature != Nature.Propale)
            {
                _context.OpportuniteTasks.RemoveRange(existingOperationalTasks);
                await _context.SaveChangesAsync(cancellationToken);
                return;
            }

            // Get task definitions for the new nature
            var newTaskDefinitions = newNature != null && TaskNamePercentage.Percentages.ContainsKey(newNature.Value)
                ? TaskNamePercentage.Percentages[newNature.Value]
                : new Dictionary<TaskName, double>();

            // Keep track of task names that exist in the new nature
            var newTaskNames = newTaskDefinitions.Keys.ToHashSet();

            // Remove tasks that match the new nature type but don't exist in the new nature's task list
            var tasksToRemove = existingOperationalTasks
                .Where(t => t.Nature == newNature && t.Name.HasValue && !newTaskNames.Contains(t.Name.Value))
                .ToList();
            _context.OpportuniteTasks.RemoveRange(tasksToRemove);

            // Update existing tasks that exist in both natures
            var tasksToUpdate = existingOperationalTasks
                .Where(t => t.Nature == newNature && t.Name.HasValue && newTaskNames.Contains(t.Name.Value));
            foreach (var task in tasksToUpdate)
            {
                if (task.Name.HasValue && newTaskDefinitions.ContainsKey(task.Name.Value))
                {
                    task.Percentage = newTaskDefinitions[task.Name.Value];
                    newTaskNames.Remove(task.Name.Value); // Remove from set to track which tasks we still need to create
                }
            }

            // Add new tasks that don't exist yet
            var existingNumeros = existingOperationalTasks
                .Where(t => t.Nature == newNature && t.Numero.HasValue)
                .Select(t => t.Numero ?? 0)
                .DefaultIfEmpty(0);
            var nextNumero = existingNumeros.Max() + 1;            foreach (var taskName in newTaskNames)
            {                var task = new OpportuniteTask
                {
                    Id = Guid.NewGuid(),
                    OpportuniteId = opportuniteId,
                    Name = taskName,
                    NewName = null, // Default to null for auto-generated tasks
                    Type = TaskType.Operational,
                    Percentage = newTaskDefinitions[taskName],
                    Numero = nextNumero++,
                    Equipe = new Dictionary<Guid, bool>(),
                    Done = false,
                    Nature = newNature,
                    Statut = StatutTache.NotStarted // Default status
                };_context.OpportuniteTasks.Add(task);
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task HandlePartnerExistsChange(Guid opportuniteId, bool oldPartnerExists, bool newPartnerExists, CancellationToken cancellationToken = default)
        {
            // If partner status hasn't changed, do nothing
            if (oldPartnerExists == newPartnerExists)
                return;

            // If partner now exists and didn't before, create BRIDGE task
            if (!oldPartnerExists && newPartnerExists)
            {
                await CreateBridgeTask(opportuniteId, cancellationToken);
            }
            // If partner no longer exists and used to exist, delete BRIDGE task
            else if (oldPartnerExists && !newPartnerExists)
            {
                await DeleteBridgeTask(opportuniteId, cancellationToken);
            }
        }

        public async Task HandleCountryChange(Guid opportuniteId, string? oldCountry, string? newCountry, CancellationToken cancellationToken = default)
        {
            var oldIsTunisia = IsTunisia(oldCountry);
            var newIsTunisia = IsTunisia(newCountry);

            // If Tunisia status hasn't changed, do nothing
            if (oldIsTunisia == newIsTunisia)
                return;

            // If country changed from Tunisia to non-Tunisia, create Revue de Taxe task
            if (oldIsTunisia && !newIsTunisia)
            {
                await CreateRevueDeTaxeTask(opportuniteId, cancellationToken);
            }
            // If country changed from non-Tunisia to Tunisia, delete Revue de Taxe task
            else if (!oldIsTunisia && newIsTunisia)
            {
                await DeleteRevueDeTaxeTask(opportuniteId, cancellationToken);
            }
        }

        private async Task CreateBridgeTask(Guid opportuniteId, CancellationToken cancellationToken)
        {
            // Check if BRIDGE task already exists to avoid duplicates
            var existingBridgeTask = await _context.OpportuniteTasks
                .FirstOrDefaultAsync(t => t.OpportuniteId == opportuniteId && 
                                        t.Name == TaskName.BRIDGE && 
                                        t.Type == TaskType.Administrative, 
                                   cancellationToken);            if (existingBridgeTask != null)
                return; // Task already exists
            
            // Get the next administrative task number
            var adminTasks = await _context.OpportuniteTasks
                .Where(t => t.OpportuniteId == opportuniteId && t.Type == TaskType.Administrative && t.Numero.HasValue)
                .Select(t => t.Numero!.Value)
                .ToListAsync(cancellationToken);
            
            var maxAdminNumero = adminTasks.Count > 0 ? adminTasks.Max() : 0;

            var bridgeTask = new OpportuniteTask
            {
                Id = Guid.NewGuid(),
                OpportuniteId = opportuniteId,
                Name = TaskName.BRIDGE,
                NewName = null,
                Type = TaskType.Administrative,
                Percentage = null,
                Numero = maxAdminNumero + 1,
                Equipe = null,
                DateAssigned = null,
                DateDone = null,
                Done = false,
                Nature = null,
                Statut = StatutTache.NotStarted
            };

            _context.OpportuniteTasks.Add(bridgeTask);
            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task DeleteBridgeTask(Guid opportuniteId, CancellationToken cancellationToken)
        {
            // Find and remove the BRIDGE task
            var bridgeTask = await _context.OpportuniteTasks
                .FirstOrDefaultAsync(t => t.OpportuniteId == opportuniteId && 
                                        t.Name == TaskName.BRIDGE && 
                                        t.Type == TaskType.Administrative, 
                                   cancellationToken);

            if (bridgeTask != null)
            {
                _context.OpportuniteTasks.Remove(bridgeTask);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        private async Task CreateRevueDeTaxeTask(Guid opportuniteId, CancellationToken cancellationToken)
        {
            // Check if Revue de Taxe task already exists to avoid duplicates
            var existingRevueDeTaxeTask = await _context.OpportuniteTasks
                .FirstOrDefaultAsync(t => t.OpportuniteId == opportuniteId && 
                                        t.Name == TaskName.RevueDeTaxe && 
                                        t.Type == TaskType.Administrative, 
                                   cancellationToken);

            if (existingRevueDeTaxeTask != null)
                return; // Task already exists
            
            // Get the next administrative task number
            var adminTasks = await _context.OpportuniteTasks
                .Where(t => t.OpportuniteId == opportuniteId && t.Type == TaskType.Administrative && t.Numero.HasValue)
                .Select(t => t.Numero!.Value)
                .ToListAsync(cancellationToken);
            
            var maxAdminNumero = adminTasks.Count > 0 ? adminTasks.Max() : 0;

            var revueDeTaxeTask = new OpportuniteTask
            {
                Id = Guid.NewGuid(),
                OpportuniteId = opportuniteId,
                Name = TaskName.RevueDeTaxe,
                NewName = null,
                Type = TaskType.Administrative,
                Percentage = null,
                Numero = maxAdminNumero + 1,
                Equipe = null,
                DateAssigned = null,
                DateDone = null,
                Done = false,
                Nature = null,
                Statut = StatutTache.NotStarted
            };

            _context.OpportuniteTasks.Add(revueDeTaxeTask);
            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task DeleteRevueDeTaxeTask(Guid opportuniteId, CancellationToken cancellationToken)
        {
            // Find and remove the Revue de Taxe task
            var revueDeTaxeTask = await _context.OpportuniteTasks
                .FirstOrDefaultAsync(t => t.OpportuniteId == opportuniteId && 
                                        t.Name == TaskName.RevueDeTaxe && 
                                        t.Type == TaskType.Administrative, 
                                   cancellationToken);

            if (revueDeTaxeTask != null)
            {
                _context.OpportuniteTasks.Remove(revueDeTaxeTask);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        private static TaskType GetTaskType(TaskName taskName)
        {
            // Define which tasks are operational vs administrative
            return taskName switch
            {
                TaskName.WhyEY => TaskType.Operational,
                TaskName.Contexte => TaskType.Operational,
                TaskName.Cvs => TaskType.Administrative,
                TaskName.References => TaskType.Administrative,
                TaskName.CommentairesAuxTDR => TaskType.Operational,
                TaskName.Methodologie => TaskType.Operational,
                TaskName.Planning => TaskType.Administrative,
                _ => TaskType.Operational
            };
        }

        /// <summary>
        /// Checks if a country is Tunisia (handles various spelling forms)
        /// </summary>
        /// <param name="country">The country name to check</param>
        /// <returns>True if the country is Tunisia, false otherwise</returns>
        private static bool IsTunisia(string? country)
        {
            if (string.IsNullOrWhiteSpace(country))
                return false;

            var normalizedCountry = country.Trim().ToLowerInvariant();
            
            // Check for various spellings of Tunisia
            return normalizedCountry == "tunisia" || 
                   normalizedCountry == "tunisie" ||
                   normalizedCountry == "tunisian republic" ||
                   normalizedCountry == "république tunisienne" ||
                   normalizedCountry == "republic of tunisia";
        }
    }
}
