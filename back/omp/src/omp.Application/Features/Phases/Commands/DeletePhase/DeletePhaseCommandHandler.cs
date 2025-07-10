using MediatR;
using omp.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using omp.Domain.Services;
using omp.Domain.Entites;

namespace omp.Application.Features.Phases.Commands.DeletePhase
{
    public class DeletePhaseCommandHandler : IRequestHandler<DeletePhaseCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public DeletePhaseCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<bool> Handle(DeletePhaseCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var phase = await _context.Phases.FindAsync(request.Id);
                
                if (phase == null) return false;

                // Store the proposition ID and phase number before removing the phase
                var propositionId = phase.IdPropositionFinanciere;
                var deletedPhaseNumber = phase.Numero;
                
                if (!propositionId.HasValue)
                {
                    // If phase isn't linked to a proposition, just delete it
                    _context.Phases.Remove(phase);
                    await _context.SaveChangesAsync(cancellationToken);
                    return true;
                }
                
                // Get the proposition financiere to update its matrices
                var propositionToUpdate = await _context.PropositionsFinancieres
                    .FirstOrDefaultAsync(p => p.Id == propositionId.Value, cancellationToken);
                    
                if (propositionToUpdate == null)
                {
                    _context.Phases.Remove(phase);
                    await _context.SaveChangesAsync(cancellationToken);
                    return true;
                }
                
                // Get all livrables for this phase to determine which columns to remove from matrices
                var livrablesInPhase = await _context.Livrables
                    .Where(l => l.IdPhase == phase.Id)
                    .OrderBy(l => l.Numero)
                    .ToListAsync(cancellationToken);
                    
                // Early exit if no livrables
                if (!livrablesInPhase.Any())
                {
                    _context.Phases.Remove(phase);
                    await _context.SaveChangesAsync(cancellationToken);
                    return true;
                }
                
                // Get all livrables and phases for calculations
                var allLivrables = await _context.Livrables
                    .Where(l => l.IdPhase.HasValue)
                    .ToListAsync(cancellationToken);
                    
                var allPhases = await _context.Phases
                    .Where(p => p.IdPropositionFinanciere == propositionId)
                    .ToListAsync(cancellationToken);
                
                // Calculate positions of all livrables in the phase within the matrices
                var columnIndicesToRemove = new List<int>();
                foreach (var livrable in livrablesInPhase)
                {
                    if (livrable.Numero.HasValue && livrable.IdPhase.HasValue)
                    {
                        // Calculate the column index for this livrable (convert from 1-based to 0-based)
                        int columnIndex = _calculationsService.CalculateNumeroInProposition(livrable, allLivrables, allPhases) - 1;
                        columnIndicesToRemove.Add(columnIndex);
                    }
                }
                
                // Sort column indices in descending order to avoid shifting issues when removing columns
                columnIndicesToRemove = columnIndicesToRemove.Distinct().OrderByDescending(i => i).ToList();
                
                if (columnIndicesToRemove.Count > 0)
                {
                    // Update MatricePL
                    if (propositionToUpdate.MatricePL != null && propositionToUpdate.MatricePL.Any())
                    {
                        propositionToUpdate.MatricePL = RemoveColumnsFromMatrix(propositionToUpdate.MatricePL, columnIndicesToRemove);
                    }
                    
                    // Update MatricePLSiege
                    if (propositionToUpdate.MatricePLSiege != null && propositionToUpdate.MatricePLSiege.Any())
                    {
                        propositionToUpdate.MatricePLSiege = RemoveColumnsFromMatrix(propositionToUpdate.MatricePLSiege, columnIndicesToRemove);
                    }
                    
                    // Update MatricePLTerrain
                    if (propositionToUpdate.MatricePLTerrain != null && propositionToUpdate.MatricePLTerrain.Any())
                    {
                        propositionToUpdate.MatricePLTerrain = RemoveColumnsFromMatrix(propositionToUpdate.MatricePLTerrain, columnIndicesToRemove);
                    }
                    
                    // Save the matrix changes BEFORE removing the phase
                    await _context.SaveChangesAsync(cancellationToken);
                }
                
                // Now remove the phase (and its livrables due to cascade delete)
                _context.Phases.Remove(phase);
                await _context.SaveChangesAsync(cancellationToken);
                
                // Update phase numbers for remaining phases
                if (deletedPhaseNumber.HasValue)
                {
                    var phasesToUpdate = await _context.Phases
                        .Where(p => p.IdPropositionFinanciere == propositionId && p.Numero > deletedPhaseNumber)
                        .ToListAsync(cancellationToken);

                    foreach (var p in phasesToUpdate)
                    {
                        p.Numero--;
                    }

                    await _context.SaveChangesAsync(cancellationToken);
                    
                    // If we have remaining phases, recalculate all livrables
                    if (phasesToUpdate.Any())
                    {
                        await RecalculateLivrablesAfterPhaseChange(propositionId.Value, propositionToUpdate, cancellationToken);
                    }
                }
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in DeletePhaseCommandHandler: {ex.Message}");
                throw; // Let the global exception handler deal with this
            }
        }
        
        private async Task RecalculateLivrablesAfterPhaseChange(Guid propositionId, PropositionFinanciere propositionFinanciere, CancellationToken cancellationToken)
        {
            // Get updated phases and livrables
            var updatedAllPhases = await _context.Phases
                .Where(p => p.IdPropositionFinanciere == propositionId)
                .ToListAsync(cancellationToken);
                
            var updatedAllLivrables = await _context.Livrables
                .Where(l => l.IdPhase.HasValue && updatedAllPhases.Select(p => p.Id).Contains(l.IdPhase.Value))
                .ToListAsync(cancellationToken);
                
            // Update calculations for each livrable
            foreach (var livrable in updatedAllLivrables)
            {
                if (livrable.Numero.HasValue && livrable.IdPhase.HasValue)
                {
                    // Calculate the correct NumeroInProposition
                    int numeroInProposition = _calculationsService.CalculateNumeroInProposition(
                        livrable, 
                        updatedAllLivrables,
                        updatedAllPhases);
                        
                    // Calculate livrable values using the correct NumeroInProposition
                    if (propositionFinanciere.MatricePL != null)
                    {
                        livrable.TotalParLivrable = _calculationsService.CalculateTotalParLivrable(
                            propositionFinanciere.MatricePL,
                            numeroInProposition);
                            
                        livrable.Pourcentage = _calculationsService.CalculatePourcentageLivrable(
                            propositionFinanciere.MatricePL,
                            numeroInProposition);
                    }
                }
            }
            
            await _context.SaveChangesAsync(cancellationToken);
        }
        
        private List<List<int>> RemoveColumnsFromMatrix(List<List<int>> matrix, List<int> columnIndicesToRemove)
        {
            var updatedMatrix = new List<List<int>>();
            
            foreach (var row in matrix)
            {
                var newRow = new List<int>();
                for (int i = 0; i < row.Count; i++)
                {
                    if (!columnIndicesToRemove.Contains(i))
                    {
                        newRow.Add(row[i]);
                    }
                }
                updatedMatrix.Add(newRow);
            }
            
            return updatedMatrix;
        }
    }
}