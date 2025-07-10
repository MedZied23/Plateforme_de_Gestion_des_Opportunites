using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.PropositionsFinancieres.DTOs;

namespace omp.Application.Features.PropositionsFinancieres.Queries.GetPropositionsFinancieresList
{
    public class GetPropositionsFinancieresListQueryHandler : IRequestHandler<GetPropositionsFinancieresListQuery, PaginatedList<PropositionFinanciereDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public GetPropositionsFinancieresListQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }        public async Task<PaginatedList<PropositionFinanciereDto>> Handle(GetPropositionsFinancieresListQuery request, CancellationToken cancellationToken)
        {
            // Access control: Get current user ID
            var currentUserId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User must be authenticated");

            // Build query with access control filter
            var query = _context.PropositionsFinancieres
                .Where(pf => 
                    // Case 1: Proposition is linked to an opportunity where current user is part of the team
                    _context.Opportunites.Any(o => 
                        o.IdPropositionFinanciere == pf.Id &&
                        (o.ManagerEnCharge == currentUserId ||
                         o.CoManagerEnCharge == currentUserId ||
                         o.SeniorManagerEnCharge == currentUserId ||
                         o.AssocieEnCharge == currentUserId)) ||
                    // Case 2: Proposition is not linked to any opportunity and current user is the creator
                    (!_context.Opportunites.Any(o => o.IdPropositionFinanciere == pf.Id) &&
                     pf.CreatedBy == currentUserId))
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
                .AsQueryable();

            // Apply sorting based on request parameters
            query = ApplySorting(query, request.SortBy, request.SortDirection);
                
            return await Task.FromResult(PaginatedList<PropositionFinanciereDto>.Create(
                query, request.PageNumber, request.PageSize));        }        private IQueryable<PropositionFinanciereDto> ApplySorting(IQueryable<PropositionFinanciereDto> query, string? sortBy, string? sortDirection)
        {
            // Normalize the sort property name
            sortBy = sortBy?.ToLower() ?? "datemodification";

            // Define default expression for sorting by DateModification
            Expression<Func<PropositionFinanciereDto, object>> sortExpression = p => p.DateModification ?? DateTime.MinValue;

            // Map the property name to the corresponding property selector
            switch (sortBy)
            {
                case "datemodification":
                case "lastmodified":
                    sortExpression = p => p.DateModification ?? DateTime.MinValue;
                    break;
                case "datecreation":
                    sortExpression = p => p.DateCreation ?? DateTime.MinValue;
                    break;
                case "nom":
                case "name":
                    sortExpression = p => p.Nom ?? string.Empty;
                    break;
                case "totalcost":
                    sortExpression = p => p.TotalCost ?? 0;
                    break;
                case "sumhj":
                    sortExpression = p => p.SumHJ ?? 0;
                    break;
                default:
                    // Default to DateModification if the property is not recognized
                    sortExpression = p => p.DateModification ?? DateTime.MinValue;
                    break;
            }

            // Apply the sort direction
            if (sortDirection?.ToLower() == "asc")
            {
                return query.OrderBy(sortExpression);
            }
            else
            {
                return query.OrderByDescending(sortExpression);
            }
        }
    }
}