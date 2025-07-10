using omp.Domain.Entites;

namespace omp.Application.Features.BailleursDeFond.DTOs
{
    public class BailleurDeFondDto
    {
        public Guid Id { get; set; }
        public string? NomBailleur { get; set; }
        public Modele? Modele { get; set; }
    }
}