using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using omp.Application.Common.Interfaces;
using omp.Domain.Entites;
using omp.Domain.Services;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Livrables.Commands.CreateLivrable
{
    public class CreateLivrableCommandHandler : IRequestHandler<CreateLivrableCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public CreateLivrableCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<Guid> Handle(CreateLivrableCommand request, CancellationToken cancellationToken)
        {
            var entity = new Livrable
            {
                Id = Guid.NewGuid(),
                Nom = request.Nom,
                Numero = request.Numero,
                StartWeek = request.StartWeek,
                EndWeek = request.EndWeek,
                Duration = request.Duration,
                IdPhase = request.IdPhase
            };

            // Only perform calculations if this livrable is linked to a phase and has the necessary data
            if (request.IdPhase.HasValue && request.Numero.HasValue)
            {
                var phase = await _context.Phases.FindAsync(request.IdPhase.Value);

                if (phase?.IdPropositionFinanciere != null)
                {
                    var propositionFinanciere = await _context.PropositionsFinancieres
                        .FindAsync(phase.IdPropositionFinanciere.Value);

                    if (propositionFinanciere != null)
                    {
                        try
                        {
                            // Get all livrables to calculate the exact position
                            var allLivrables = await _context.Livrables
                                .Where(l => l.IdPhase.HasValue)
                                .ToListAsync(cancellationToken);
                            
                            // Get all phases for this proposition financiere
                            var allPhases = await _context.Phases
                                .Where(p => p.IdPropositionFinanciere == phase.IdPropositionFinanciere)
                                .ToListAsync(cancellationToken);
                                
                            // Add this new livrable to the list for position calculation
                            allLivrables.Add(entity);
                            
                            // Calculate the position where the column should be inserted
                            int numeroInProposition = _calculationsService.CalculateNumeroInProposition(entity, allLivrables, allPhases);
                            
                            // Convert to 0-based index for insertion
                            int columnIndex = Math.Max(0, numeroInProposition - 1); // Ensure non-negative
                            
                            // Update MatricePL by adding a column
                            if (propositionFinanciere.MatricePL != null && propositionFinanciere.MatricePL.Any())
                            {
                                var updatedMatricePL = new List<List<int>>();
                                foreach (var row in propositionFinanciere.MatricePL)
                                {
                                    var newRow = new List<int>();
                                    
                                    // Insert zeros at the correct position, handle case where columnIndex > row.Count
                                    for (int i = 0; i < Math.Max(columnIndex + 1, row.Count + 1); i++)
                                    {
                                        if (i < columnIndex)
                                        {
                                            // Add original value if exists, otherwise add 0
                                            newRow.Add(i < row.Count ? row[i] : 0);
                                        }
                                        else if (i == columnIndex)
                                        {
                                            newRow.Add(0); // Add the new column with default value 0
                                        }
                                        else if (i - 1 < row.Count) // Check if original index exists
                                        {
                                            newRow.Add(row[i - 1]);
                                        }
                                    }
                                    updatedMatricePL.Add(newRow);
                                }
                                propositionFinanciere.MatricePL = updatedMatricePL;
                            }
                            
                            // Similarly update MatricePLSiege with additional bounds checking
                            if (propositionFinanciere.MatricePLSiege != null && propositionFinanciere.MatricePLSiege.Any())
                            {
                                var updatedMatricePLSiege = new List<List<int>>();
                                foreach (var row in propositionFinanciere.MatricePLSiege)
                                {
                                    var newRow = new List<int>();
                                    
                                    // Insert zeros at the correct position with bounds checking
                                    for (int i = 0; i < Math.Max(columnIndex + 1, row.Count + 1); i++)
                                    {
                                        if (i < columnIndex)
                                        {
                                            newRow.Add(i < row.Count ? row[i] : 0);
                                        }
                                        else if (i == columnIndex)
                                        {
                                            newRow.Add(0); // Add the new column with default value 0
                                        }
                                        else if (i - 1 < row.Count) // Check if original index exists
                                        {
                                            newRow.Add(row[i - 1]);
                                        }
                                    }
                                    updatedMatricePLSiege.Add(newRow);
                                }
                                propositionFinanciere.MatricePLSiege = updatedMatricePLSiege;
                            }
                            
                            // Similarly update MatricePLTerrain with additional bounds checking
                            if (propositionFinanciere.MatricePLTerrain != null && propositionFinanciere.MatricePLTerrain.Any())
                            {
                                var updatedMatricePLTerrain = new List<List<int>>();
                                foreach (var row in propositionFinanciere.MatricePLTerrain)
                                {
                                    var newRow = new List<int>();
                                    
                                    // Insert zeros at the correct position with bounds checking
                                    for (int i = 0; i < Math.Max(columnIndex + 1, row.Count + 1); i++)
                                    {
                                        if (i < columnIndex)
                                        {
                                            newRow.Add(i < row.Count ? row[i] : 0);
                                        }
                                        else if (i == columnIndex)
                                        {
                                            newRow.Add(0); // Add the new column with default value 0
                                        }
                                        else if (i - 1 < row.Count) // Check if original index exists
                                        {
                                            newRow.Add(row[i - 1]);
                                        }
                                    }
                                    updatedMatricePLTerrain.Add(newRow);
                                }
                                propositionFinanciere.MatricePLTerrain = updatedMatricePLTerrain;
                            }
                            
                            // Update the par jour matrices
                            if (propositionFinanciere.NbrJoursParMois.HasValue)
                            {
                                propositionFinanciere.MatricePLSiegeParJour = _calculationsService.CalculateMatricePLSiegeParJour(
                                    propositionFinanciere.MatricePLSiege, propositionFinanciere.NbrJoursParMois);
                                    
                                propositionFinanciere.MatricePLTerrainParJour = _calculationsService.CalculateMatricePLTerrainParJour(
                                    propositionFinanciere.MatricePLTerrain, propositionFinanciere.NbrJoursParMois);
                            }
                            
                            // Update date modification
                            propositionFinanciere.DateModification = DateTime.UtcNow;
                            
                            // Calculate livrable values using CalculationsService
                            entity.TotalParLivrable = _calculationsService.CalculateTotalParLivrable(
                                propositionFinanciere.MatricePL,
                                numeroInProposition);
                            
                            entity.Pourcentage = _calculationsService.CalculatePourcentageLivrable(
                                propositionFinanciere.MatricePL,
                                numeroInProposition);
                                
                            // Update the proposition financiere in the database
                            _context.PropositionsFinancieres.Update(propositionFinanciere);
                        }
                        catch (Exception ex)
                        {
                            // Log the exception and create Livrable without modifying matrices
                            Console.WriteLine($"Error updating matrices: {ex.Message}");
                            // Continue execution to still create the livrable without calculations
                        }
                    }
                }
            }

            _context.Livrables.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}