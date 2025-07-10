using System;
using System.Collections.Generic;
using System.Linq;

namespace omp.Domain.Entites
{
    public class OpportuniteTask
    {
        public Guid Id { get; set; }
        public Guid? OpportuniteId { get; set; }  // Foreign key to Opportunite
        public TaskName? Name { get; set; }
        public string? NewName { get; set; }
        public TaskType? Type { get; set; }
        public Dictionary<Guid, bool>? Equipe { get; set; } = new();  // Dictionary of user guids and their completion status
        public DateTime? DateAssigned { get; set; }
        public DateTime? DateDone { get; set; }
        public double? Percentage { get; set; }  // Value from TaskNamePercentage dictionary
        public int? Numero { get; set; }  // Insertion order in opportunite nature
        public bool? Done { get; set; }
        public Nature? Nature { get; set; }  // null if the task is administrative
        public StatutTache? Statut { get; set; }  // Status of the task        /// <summary>
        /// Sets the completion status for a specific team member
        /// If any team member becomes incomplete (false), Done becomes false
        /// </summary>
        /// <param name="userId">The user ID to update</param>
        /// <param name="isCompleted">The completion status</param>
        public void SetTeamMemberStatus(Guid userId, bool isCompleted)
        {
            if (Equipe == null)
            {
                Equipe = new Dictionary<Guid, bool>();
            }

            Equipe[userId] = isCompleted;

            // If any team member becomes incomplete, Done becomes false
            if (!isCompleted)
            {
                Done = false;
            }
            else
            {
                // Check if all team members are now complete
                UpdateDoneStatus();
            }
        }

        /// <summary>
        /// Sets the Done status and cascades the change to all team members
        /// When Done becomes false, all team members become false
        /// When Done becomes true, it only succeeds if all team members are already true
        /// </summary>
        /// <param name="isDone">The Done status to set</param>
        public void SetDoneStatus(bool isDone)
        {
            if (!isDone)
            {
                // When Done becomes false, all team members become false
                Done = false;
                if (Equipe != null)
                {
                    var keys = Equipe.Keys.ToList();
                    foreach (var key in keys)
                    {
                        Equipe[key] = false;
                    }
                }
            }
            else
            {
                // When trying to set Done to true, check if all team members are complete
                if (Equipe == null || !Equipe.Any())
                {
                    Done = false;
                }
                else
                {
                    Done = Equipe.Values.All(completed => completed);
                }
            }
        }

        /// <summary>
        /// Updates the Done status based on team member completion status
        /// All team members must have completed their tasks (true) for Done to be true
        /// This method only updates Done based on current team status, doesn't cascade changes
        /// </summary>
        public void UpdateDoneStatus()
        {
            if (Equipe == null || !Equipe.Any())
            {
                Done = false;
                return;
            }

            // All team members must have completed their tasks (AND relation)
            Done = Equipe.Values.All(completed => completed);
        }

        /// <summary>
        /// Helper method to initialize team members with incomplete status
        /// Use this when adding new team members to ensure they start with incomplete status
        /// </summary>
        public void AddTeamMember(Guid userId)
        {
            if (Equipe == null)
            {
                Equipe = new Dictionary<Guid, bool>();
            }

            Equipe[userId] = false;
            // Adding an incomplete team member makes the task incomplete
            Done = false;
        }

        /// <summary>
        /// Helper method to remove a team member from the task
        /// </summary>
        /// <param name="userId">The user ID to remove</param>
        public void RemoveTeamMember(Guid userId)
        {
            if (Equipe != null && Equipe.ContainsKey(userId))
            {
                Equipe.Remove(userId);
                // Recalculate Done status after removing team member
                UpdateDoneStatus();
            }
        }

    }
}
