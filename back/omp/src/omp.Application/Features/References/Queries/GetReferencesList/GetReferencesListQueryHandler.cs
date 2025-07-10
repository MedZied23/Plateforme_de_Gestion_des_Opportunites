using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.References.DTOs;
using omp.Domain.Entites;

namespace omp.Application.Features.References.Queries.GetReferencesList
{
    public class GetReferencesListQueryHandler : IRequestHandler<GetReferencesListQuery, PaginatedList<ReferenceDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetReferencesListQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PaginatedList<ReferenceDto>> Handle(GetReferencesListQuery request, CancellationToken cancellationToken)
        {
            // First apply sorting on the entity level
            var query = _context.References.AsQueryable();
            query = ApplySorting(query, request.SortBy, request.SortDirection);

            // Get total count for pagination
            var count = await query.CountAsync(cancellationToken);

            // Apply pagination and fetch the data
            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            // Map to DTOs after fetching the data
            var dtos = items.Select(item => _mapper.Map<ReferenceDto>(item)).ToList();

            return new PaginatedList<ReferenceDto>(dtos, count, request.PageNumber, request.PageSize);
        }

        private IQueryable<Reference> ApplySorting(IQueryable<Reference> query, string sortBy, string sortDirection)
        {
            // Normalize the sort property name and direction
            sortBy = sortBy?.ToLower() ?? "lastaccessed";
            var isDescending = sortDirection?.ToLower() == "desc";

            // Apply sorting based on the property name
            query = sortBy switch
            {
                "lastaccessed" => isDescending 
                    ? query.OrderByDescending(r => r.LastAccessed)
                    : query.OrderBy(r => r.LastAccessed),
                "lastmodified" => isDescending
                    ? query.OrderByDescending(r => r.LastModified)
                    : query.OrderBy(r => r.LastModified),
                "nom" => isDescending
                    ? query.OrderByDescending(r => r.Nom)
                    : query.OrderBy(r => r.Nom),
                "country" => isDescending
                    ? query.OrderByDescending(r => r.Country)
                    : query.OrderBy(r => r.Country),
                "client" => isDescending
                    ? query.OrderByDescending(r => r.Client)
                    : query.OrderBy(r => r.Client),
                "budget" => isDescending
                    ? query.OrderByDescending(r => r.Budget)
                    : query.OrderBy(r => r.Budget),
                "datedebut" => isDescending
                    ? query.OrderByDescending(r => r.DateDebut)
                    : query.OrderBy(r => r.DateDebut),
                "datefin" => isDescending
                    ? query.OrderByDescending(r => r.DateFin)
                    : query.OrderBy(r => r.DateFin),
                _ => query.OrderByDescending(r => r.LastAccessed) // default sorting
            };

            return query;
        }
    }
}