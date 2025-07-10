using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace omp.Domain.Entites
{
    public class User
    {
        public Guid Id { get; set; }
        public required string Nom { get; set; }
        public required string Prenom { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; } 
        public required string Phone { get; set; }
        public Role Role { get; set; }
    }
}
