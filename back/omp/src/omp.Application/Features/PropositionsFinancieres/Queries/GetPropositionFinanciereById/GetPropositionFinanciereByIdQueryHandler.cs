using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.PropositionsFinancieres.DTOs;
using omp.Domain.Entites;

namespace omp.Application.Features.PropositionsFinancieres.Queries.GetPropositionFinanciereById
{
    public class GetPropositionFinanciereByIdQueryHandler : IRequestHandler<GetPropositionFinanciereByIdQuery, PropositionFinanciereDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public GetPropositionFinanciereByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }        public async Task<PropositionFinanciereDto> Handle(GetPropositionFinanciereByIdQuery request, CancellationToken cancellationToken)
        {
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");
            
            var proposition = await _context.PropositionsFinancieres
                .Where(pf => pf.Id == request.Id)
                .FirstOrDefaultAsync(cancellationToken);
                
            if (proposition == null)
                return null;
            
            // Check access control
            await CheckPropositionAccess(proposition, currentUserId, cancellationToken);

            return await _context.PropositionsFinancieres
                .Where(pf => pf.Id == request.Id)
                .Select(pf => new PropositionFinanciereDto
                {
                    Id = pf.Id,
                    Nom = pf.Nom,
                    DateCreation = pf.DateCreation,
                    DateModification = pf.DateModification,
                    CreatedBy = pf.CreatedBy,
                    nbrSemaines = pf.nbrSemaines,
                    MatricePL = pf.MatricePL,
                    MatricePLSiege = pf.MatricePLSiege, 
                    MatricePLTerrain = pf.MatricePLTerrain,
                    MatricePLSiegeParJour = pf.MatricePLSiegeParJour,
                    MatricePLTerrainParJour = pf.MatricePLTerrainParJour,
                    TotalCost = pf.TotalCost,
                    AverageTJM = pf.AverageTJM,
                    SumHJ = pf.SumHJ,
                    BudgetPartEY = pf.BudgetPartEY,
                    BudgetsPartenaires = pf.BudgetsPartenaires,
                    NbrHJPartEY = pf.NbrHJPartEY,
                    NbrHJPartenaires = pf.NbrHJPartenaires,
                    PourcentHjEY = pf.PourcentHjEY,
                    PourcentHjPartenaires = pf.PourcentHjPartenaires,
                    PourcentBudgetEY = pf.PourcentBudgetEY,
                    PourcentBudgetPartenaires = pf.PourcentBudgetPartenaires,
                    TotalExpenses = pf.TotalExpenses,
                    TotalProjet = pf.TotalProjet,
                    NbrJoursParMois = pf.NbrJoursParMois,
                    prixDepenses = pf.prixDepenses,
                    LinkTeams = pf.LinkTeams,
                    Status = pf.Status
                })
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task CheckPropositionAccess(PropositionFinanciere proposition, Guid currentUserId, CancellationToken cancellationToken)
        {
            // Check if proposition is linked to an opportunity
            var linkedOpportunity = await _context.Opportunites
                .Where(o => o.IdPropositionFinanciere == proposition.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (linkedOpportunity != null)
            {
                // Proposition is linked to an opportunity
                // Only manager en charge, co-manager en charge, senior manager en charge and associe en charge can see it
                bool canAccess = linkedOpportunity.ManagerEnCharge == currentUserId ||
                               linkedOpportunity.CoManagerEnCharge == currentUserId ||
                               linkedOpportunity.SeniorManagerEnCharge == currentUserId ||
                               linkedOpportunity.AssocieEnCharge == currentUserId;

                if (!canAccess)
                {
                    throw new UnauthorizedAccessException("You don't have permission to access this proposition financiere. Only the manager en charge, co-manager en charge, senior manager en charge, and associe en charge of the linked opportunity can access it.");
                }
            }
            else
            {
                // Proposition is not linked to an opportunity
                // Only the person who created it can see it
                if (proposition.CreatedBy != currentUserId)
                {
                    throw new UnauthorizedAccessException("You don't have permission to access this proposition financiere. Only the creator can access propositions that are not linked to an opportunity.");
                }
            }
        }
    }
}