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
using omp.Application.Features.Cvs.DTOs;

namespace omp.Application.Features.Cvs.Queries.GetAllCvs
{
    public class GetAllCvsQueryHandler : IRequestHandler<GetAllCvsQuery, PaginatedList<CvDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllCvsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedList<CvDto>> Handle(GetAllCvsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Cvs
                .Select(cv => new CvDto
                {
                    Id = cv.Id,
                    Id_user = cv.Id_user,
                    Presentation = cv.Presentation,
                    documentUrl = cv.documentUrl,
                    Formations = cv.Formations,
                    LanguesPratiquees = cv.LanguesPratiquees,
                    Experiences = cv.Experiences,
                    Certifications = cv.Certifications,
                    Projets = cv.Projets,
                    LastAccessed = cv.LastAccessed
                })
                .AsQueryable();

            // Apply sorting based on request parameters
            query = ApplySorting(query, request.SortBy, request.SortDirection);
            
            return await Task.FromResult(PaginatedList<CvDto>.Create(
                query, request.PageNumber, request.PageSize));
        }

        private IQueryable<CvDto> ApplySorting(IQueryable<CvDto> query, string sortBy, string sortDirection)
        {
            // Normalize the sort property name
            sortBy = sortBy?.ToLower() ?? "lastaccessed";

            // Define default expression for sorting by LastAccessed
            Expression<Func<CvDto, object>> sortExpression = null;

            // Map the property name to the corresponding property selector
            switch (sortBy)
            {
                case "lastaccessed":
                    sortExpression = p => p.LastAccessed ?? DateTime.MinValue;
                    break;
                case "id_user":
                    sortExpression = p => p.Id_user;
                    break;
                default:
                    // Default to LastAccessed if the property is not recognized
                    sortExpression = p => p.LastAccessed ?? DateTime.MinValue;
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