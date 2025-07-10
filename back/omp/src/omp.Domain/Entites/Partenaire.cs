using System;

namespace omp.Domain.Entites
{
    public enum TypePartenaire
    {
        ExpertIndividuel,
        Entreprise
    }


    public class Partenaire
    {
        public Guid Id { get; set; }
        public TypePartenaire? Type { get; set; }
        public string? Nom { get; set; }
        public String? Domaine { get; set; }
        public string? ContactCle { get; set; }

    }
}
