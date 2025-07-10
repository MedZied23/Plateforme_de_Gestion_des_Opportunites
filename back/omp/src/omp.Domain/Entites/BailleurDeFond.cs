using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace omp.Domain.Entites
{
    public class BailleurDeFond
    {
        public Guid Id { get; set; }  // Identifiant du bailleur de fond
        public string? NomBailleur { get; set; }  // Nom du bailleur de fond
        public Modele? Modele { get; set; }  // Modèle de financement
    }
}
