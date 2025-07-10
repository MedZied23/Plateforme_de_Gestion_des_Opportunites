using System;
using System.Collections.Generic;

namespace omp.Application.Features.Notifications.DTOs
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public List<Guid> RecipientIds { get; set; } = new List<Guid>();
        public Guid? SenderId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public DateTime DateSent { get; set; }
        public bool Read { get; set; }
        public DateTime? DateRead { get; set; }
        public Guid? OpportuniteId { get; set; }
        public Guid? PropositionFinanciereId { get; set; }
    }
}
