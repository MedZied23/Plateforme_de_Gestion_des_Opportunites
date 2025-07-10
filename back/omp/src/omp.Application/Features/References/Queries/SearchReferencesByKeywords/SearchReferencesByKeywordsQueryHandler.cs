using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FuzzySharp;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.References.DTOs;
using omp.Domain.Entites;

namespace omp.Application.Features.References.Queries.SearchReferencesByKeywords
{
    public class SearchReferencesByKeywordsQueryHandler : IRequestHandler<SearchReferencesByKeywordsQuery, PaginatedList<ReferenceSearchResultDto>>
    {
        private readonly IApplicationDbContext _context;

        public SearchReferencesByKeywordsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedList<ReferenceSearchResultDto>> Handle(SearchReferencesByKeywordsQuery request, CancellationToken cancellationToken)
        {
            // Get all References with initial filtering
            var referencesQuery = _context.References.AsNoTracking();
            
            // Apply filters before loading references
            // Filter by Offre (exact match)
            if (!string.IsNullOrWhiteSpace(request.Offre))
            {
                referencesQuery = referencesQuery.Where(r => r.Offre == request.Offre);
            }
            
            // Filter by Country (exact match)
            if (!string.IsNullOrWhiteSpace(request.Country))
            {
                referencesQuery = referencesQuery.Where(r => r.Country == request.Country);
            }
            
            // Filter by Budget range
            if (request.BudgetMin.HasValue)
            {
                referencesQuery = referencesQuery.Where(r => r.Budget >= request.BudgetMin.Value);
            }
            
            if (request.BudgetMax.HasValue)
            {
                referencesQuery = referencesQuery.Where(r => r.Budget <= request.BudgetMax.Value);
            }
            
            // Filter by DateDebut range
            if (request.DateDebutMin.HasValue)
            {
                referencesQuery = referencesQuery.Where(r => r.DateDebut >= request.DateDebutMin.Value);
            }
            
            if (request.DateDebutMax.HasValue)
            {
                referencesQuery = referencesQuery.Where(r => r.DateDebut <= request.DateDebutMax.Value);
            }
            
            // Filter by DateFin range
            if (request.DateFinMin.HasValue)
            {
                referencesQuery = referencesQuery.Where(r => r.DateFin >= request.DateFinMin.Value);
            }
            
            if (request.DateFinMax.HasValue)
            {
                referencesQuery = referencesQuery.Where(r => r.DateFin <= request.DateFinMax.Value);
            }
            
            // Execute the query with all filters applied to get filtered references
            var allReferences = await referencesQuery.ToListAsync(cancellationToken);
            
            // If no keywords provided, return the filtered references (limited to 50)
            var keywords = request.Keywords?.Split(' ', ',', ';', '-', '_')
                .Where(k => !string.IsNullOrWhiteSpace(k))
                .Select(k => k.Trim().ToLower())
                .ToList() ?? new List<string>();

            if (keywords.Count == 0)
            {
                // Return paginated filtered references
                var allReferencesCount = allReferences.Count;
                var pagedReferences = allReferences
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(r => new ReferenceSearchResultDto
                    {
                        Id = r.Id,
                        Nom = r.Nom,
                        Country = r.Country,
                        Offre = r.Offre,
                        Client = r.Client,
                        Budget = r.Budget,
                        DateDebut = r.DateDebut,
                        DateFin = r.DateFin,
                        Equipe = r.Equipe,
                        Description = r.Description,
                        Services = r.Services,
                        DocumentUrl = r.DocumentUrl,
                        MatchedServiceKeys = new List<string>(),
                        SimilarityScore = 0
                    })
                    .ToList();
                    
                return new PaginatedList<ReferenceSearchResultDto>(pagedReferences, allReferencesCount, request.PageNumber, request.PageSize);
            }
            
            // References that match the search criteria (already filtered by earlier conditions)
            var matchingReferences = new List<(Reference Reference, List<string> MatchedKeys, int Score)>();

            // Process each reference
            foreach (var reference in allReferences)
            {
                // Skip references without Services
                if (reference.Services == null || !reference.Services.Any())
                    continue;

                // For each reference, check if it matches the keywords
                bool matchesAnyKeyword = false;
                var matchedServiceKeys = new List<string>();
                int highestScore = 0;

                // Check each keyword against the Services structure
                foreach (var keyword in keywords)
                {
                    if (request.UseFuzzySearch)
                    {
                        // Fuzzy search in Services (outermost keys)
                        foreach (var serviceCategory in reference.Services)
                        {
                            var categoryKey = serviceCategory.Key;
                            
                            // Check the outer category key
                            int categoryScore = Fuzz.PartialRatio(categoryKey.ToLower(), keyword);
                            if (categoryScore >= request.MinimumSimilarityScore)
                            {
                                matchesAnyKeyword = true;
                                if (!matchedServiceKeys.Contains(categoryKey))
                                    matchedServiceKeys.Add(categoryKey);
                                highestScore = Math.Max(highestScore, categoryScore);
                            }
                            
                            // Check inner dictionary keys and values
                            foreach (var service in serviceCategory.Value)
                            {
                                var serviceKey = service.Key;
                                
                                // Check the inner service key
                                int serviceKeyScore = Fuzz.PartialRatio(serviceKey.ToLower(), keyword);
                                if (serviceKeyScore >= request.MinimumSimilarityScore)
                                {
                                    matchesAnyKeyword = true;
                                    if (!matchedServiceKeys.Contains($"{categoryKey} > {serviceKey}"))
                                        matchedServiceKeys.Add($"{categoryKey} > {serviceKey}");
                                    highestScore = Math.Max(highestScore, serviceKeyScore);
                                }
                                
                                // Check service values (which are lists of strings)
                                if (service.Value != null)
                                {
                                    foreach (var value in service.Value)
                                    {
                                        int valueScore = Fuzz.PartialRatio(value.ToLower(), keyword);
                                        if (valueScore >= request.MinimumSimilarityScore)
                                        {
                                            matchesAnyKeyword = true;
                                            if (!matchedServiceKeys.Contains($"{categoryKey} > {serviceKey} > {value}"))
                                                matchedServiceKeys.Add($"{categoryKey} > {serviceKey} > {value}");
                                            highestScore = Math.Max(highestScore, valueScore);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        // Exact substring matching in Services
                        foreach (var serviceCategory in reference.Services)
                        {
                            var categoryKey = serviceCategory.Key;
                            
                            // Check the outer category key
                            if (categoryKey.ToLower().Contains(keyword))
                            {
                                matchesAnyKeyword = true;
                                if (!matchedServiceKeys.Contains(categoryKey))
                                    matchedServiceKeys.Add(categoryKey);
                            }
                            
                            // Check inner dictionary keys and values
                            foreach (var service in serviceCategory.Value)
                            {
                                var serviceKey = service.Key;
                                
                                // Check the inner service key
                                if (serviceKey.ToLower().Contains(keyword))
                                {
                                    matchesAnyKeyword = true;
                                    if (!matchedServiceKeys.Contains($"{categoryKey} > {serviceKey}"))
                                        matchedServiceKeys.Add($"{categoryKey} > {serviceKey}");
                                }
                                
                                // Check service values (which are lists of strings)
                                if (service.Value != null)
                                {
                                    foreach (var value in service.Value)
                                    {
                                        if (value.ToLower().Contains(keyword))
                                        {
                                            matchesAnyKeyword = true;
                                            if (!matchedServiceKeys.Contains($"{categoryKey} > {serviceKey} > {value}"))
                                                matchedServiceKeys.Add($"{categoryKey} > {serviceKey} > {value}");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // If this reference matches any of the keywords, add it to the results
                if (matchesAnyKeyword)
                {
                    matchingReferences.Add((reference, matchedServiceKeys, highestScore));
                }
            }

            // Convert matching references to DTOs and apply pagination
            var allResults = matchingReferences
                .OrderByDescending(m => m.Score) // Sort by similarity score
                .Select(m => new ReferenceSearchResultDto
                {
                    Id = m.Reference.Id,
                    Nom = m.Reference.Nom,
                    Country = m.Reference.Country,
                    Offre = m.Reference.Offre,
                    Client = m.Reference.Client,
                    Budget = m.Reference.Budget,
                    DateDebut = m.Reference.DateDebut,
                    DateFin = m.Reference.DateFin,
                    Equipe = m.Reference.Equipe,
                    Description = m.Reference.Description,
                    Services = m.Reference.Services,
                    DocumentUrl = m.Reference.DocumentUrl,
                    MatchedServiceKeys = m.MatchedKeys,
                    SimilarityScore = m.Score
                })
                .ToList();

            // Apply pagination to the results
            var totalCount = allResults.Count;
            var pagedResults = allResults
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            return new PaginatedList<ReferenceSearchResultDto>(pagedResults, totalCount, request.PageNumber, request.PageSize);
        }
    }
}