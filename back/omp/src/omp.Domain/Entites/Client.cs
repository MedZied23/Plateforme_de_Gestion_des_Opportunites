using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace omp.Domain.Entites
{
    public class Client
    {
        public Guid Id { get; set; }  // Identifiant du client
        public string? NomClient { get; set; }  // Nom du client
        public string? ContactNom { get; set; }  // Nom du contact
        public string? Pays { get; set; }  // Pays du client
        public string? Type { get; set; }  // Secteur Public ou Secteur Privé
        public string? Adresse { get; set; }  // Adresse
        public string? Telephone { get; set; }  // Téléphone
    }
}
