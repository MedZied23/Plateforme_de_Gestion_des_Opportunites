using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Domain.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace omp.Application.Features.Livrables.Commands.DeleteLivrable
{
    public class DeleteLivrableCommandHandler : IRequestHandler<DeleteLivrableCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly CalculationsService _calculationsService;

        public DeleteLivrableCommandHandler(IApplicationDbContext context, CalculationsService calculationsService)
        {
            _context = context;
            _calculationsService = calculationsService;
        }

        public async Task<bool> Handle(DeleteLivrableCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.Livrables.FindAsync(request.Id);
            
            if (entity == null) return false;

            // Store the phase ID and livrable numero before removing it
            var phaseId = entity.IdPhase;
            var deletedLivrableNumero = entity.Numero;
            
            // Get the proposition financiere ID associated with this livrable's phase
            var propositionFinanciereId = await _context.Phases
                .Where(p => p.Id == phaseId)
                .Select(p => p.IdPropositionFinanciere)
                .FirstOrDefaultAsync();

            // Get all livrables for calculating the correct position in matricePL
            var allLivrables = await _context.Livrables
                .Where(l => l.IdPhase.HasValue)
                .ToListAsync(cancellationToken);
                
            // Get all phases for this proposition
            var allPhases = await _context.Phases
                .Where(p => p.IdPropositionFinanciere == propositionFinanciereId)
                .ToListAsync(cancellationToken);
            
            // Calculate the position of the livrable in the matrix before removing it
            // Calculate exactly which column index to remove
            int columnIndexToRemove = 0;
            if (entity.Numero.HasValue && entity.IdPhase.HasValue)
            {
                // The CalculateNumeroInProposition returns a 1-based position, we need to convert to 0-based
                columnIndexToRemove = _calculationsService.CalculateNumeroInProposition(entity, allLivrables, allPhases) - 1;
            }
            
            // Get the proposition financiere to update its MatricePL
            var propositionFinanciere = propositionFinanciereId.HasValue ? 
                await _context.PropositionsFinancieres.FindAsync(propositionFinanciereId.Value) : null;

            _context.Livrables.Remove(entity);
            
            // Update MatricePL by removing the column corresponding to the deleted livrable
            if (propositionFinanciere != null)
            {
                // Handle matricePL
                if (propositionFinanciere.MatricePL != null && propositionFinanciere.MatricePL.Any())
                {
                    var updatedMatricePL = new List<List<int>>();
                    foreach (var row in propositionFinanciere.MatricePL)
                    {
                        // Skip rows that are too short
                        if (row.Count <= columnIndexToRemove)
                        {
                            updatedMatricePL.Add(new List<int>(row));
                            continue;
                        }
                        
                        // Create a new row without the deleted column
                        var newRow = new List<int>();
                        for (int i = 0; i < row.Count; i++)
                        {
                            if (i != columnIndexToRemove)
                            {
                                newRow.Add(row[i]);
                            }
                        }
                        updatedMatricePL.Add(newRow);
                    }
                    
                    // Update the MatricePL in the propositionFinanciere
                    propositionFinanciere.MatricePL = updatedMatricePL;
                }
                
                // Handle matricePLSiege
                if (propositionFinanciere.MatricePLSiege != null && propositionFinanciere.MatricePLSiege.Any())
                {
                    var updatedMatricePLSiege = new List<List<int>>();
                    foreach (var row in propositionFinanciere.MatricePLSiege)
                    {
                        if (row.Count <= columnIndexToRemove)
                        {
                            updatedMatricePLSiege.Add(new List<int>(row));
                            continue;
                        }
                        
                        var newRow = new List<int>();
                        for (int i = 0; i < row.Count; i++)
                        {
                            if (i != columnIndexToRemove)
                            {
                                newRow.Add(row[i]);
                            }
                        }
                        updatedMatricePLSiege.Add(newRow);
                    }
                    propositionFinanciere.MatricePLSiege = updatedMatricePLSiege;
                }
                
                // Handle matricePLTerrain
                if (propositionFinanciere.MatricePLTerrain != null && propositionFinanciere.MatricePLTerrain.Any())
                {
                    var updatedMatricePLTerrain = new List<List<int>>();
                    foreach (var row in propositionFinanciere.MatricePLTerrain)
                    {
                        if (row.Count <= columnIndexToRemove)
                        {
                            updatedMatricePLTerrain.Add(new List<int>(row));
                            continue;
                        }
                        
                        var newRow = new List<int>();
                        for (int i = 0; i < row.Count; i++)
                        {
                            if (i != columnIndexToRemove)
                            {
                                newRow.Add(row[i]);
                            }
                        }
                        updatedMatricePLTerrain.Add(newRow);
                    }
                    propositionFinanciere.MatricePLTerrain = updatedMatricePLTerrain;
                }
            }
            
            await _context.SaveChangesAsync(cancellationToken);
            
            // If we have both a proposition ID and the deleted livrable had a numero value,
            // update the numero of all following livrables in that proposition
            if (propositionFinanciereId.HasValue && deletedLivrableNumero.HasValue)
            {
                // Get all phases belonging to this proposition financiere
                var phaseIds = await _context.Phases
                    .Where(p => p.IdPropositionFinanciere == propositionFinanciereId.Value)
                    .Select(p => p.Id)
                    .ToListAsync();
                
                // Get all livrables in these phases that have a numero greater than the deleted one
                var livrablesWithHigherNumero = await _context.Livrables
                    .Where(l => l.IdPhase.HasValue && phaseIds.Contains(l.IdPhase.Value) && l.Numero.HasValue && l.Numero > deletedLivrableNumero)
                    .OrderBy(l => l.Numero)
                    .ToListAsync();

                // Decrement the numero of each subsequent livrable
                foreach (var livrable in livrablesWithHigherNumero)
                {
                    livrable.Numero--;
                    
                    // Recalculate the values that depend on numero
                    if (propositionFinanciereId.HasValue && propositionFinanciere != null)
                    {
                        // Get all livrables again after the deletion
                        allLivrables = await _context.Livrables
                            .Where(l => l.IdPhase.HasValue)
                            .ToListAsync(cancellationToken);
                            
                        // Refresh the phases list
                        allPhases = await _context.Phases
                            .Where(p => p.IdPropositionFinanciere == propositionFinanciereId)
                            .ToListAsync(cancellationToken);
                        
                        // Calculate the correct NumeroInProposition
                        int numeroInProposition = _calculationsService.CalculateNumeroInProposition(
                            livrable, 
                            allLivrables,
                            allPhases);
                        
                        // Calculate livrable values using the correct NumeroInProposition
                        livrable.TotalParLivrable = _calculationsService.CalculateTotalParLivrable(
                            propositionFinanciere.MatricePL,
                            numeroInProposition);
                        
                        livrable.Pourcentage = _calculationsService.CalculatePourcentageLivrable(
                            propositionFinanciere.MatricePL,
                            numeroInProposition);
                    }
                }
                
                await _context.SaveChangesAsync(cancellationToken);
            }
            
            return true;
        }
    }
}