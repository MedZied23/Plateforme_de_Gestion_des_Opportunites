using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Common.Models;
using omp.Application.Features.Cvs.DTOs;
using omp.Domain.Entites;
using FuzzySharp;
using System;

namespace omp.Application.Features.Cvs.Queries.SearchCvsByProjectKeywords
{
    public class SearchCvsByProjectKeywordsQueryHandler : IRequestHandler<SearchCvsByProjectKeywordsQuery, PaginatedList<CvSearchResultDto>>
    {
        private readonly IApplicationDbContext _context;

        public SearchCvsByProjectKeywordsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }        public async Task<PaginatedList<CvSearchResultDto>> Handle(SearchCvsByProjectKeywordsQuery request, CancellationToken cancellationToken)
        {
            // Split search text into keywords
            var keywords = request.Keywords?.Split(' ', ',', ';', '-', '_')
                .Where(k => !string.IsNullOrWhiteSpace(k))
                .Select(k => k.Trim().ToLower())
                .ToList() ?? new List<string>();

            if (keywords.Count == 0)
            {
                // If no keywords provided, return all CVs (limited to 50)
                var cvResults = await _context.Cvs
                    .AsNoTracking()
                    .Take(50)
                    .ToListAsync(cancellationToken);

                var cvDtos = MapToSearchResultDtoList(cvResults, new List<Guid>());
                return PaginatedList<CvSearchResultDto>.Create(
                    cvDtos.AsQueryable(), 
                    request.PageNumber, 
                    request.PageSize);
            }

            // Since we need to check the Perimetre dictionary which is a complex type,
            // it's better to load projects first and then filter them in memory
            var allProjects = await _context.Projets.AsNoTracking().ToListAsync(cancellationToken);
            
            List<Guid> matchingProjectIds;
            
            // Determine whether to use fuzzy search or exact substring matching
            if (request.UseFuzzySearch)
            {
                matchingProjectIds = PerformFuzzySearch(allProjects, keywords, request.MinimumSimilarityScore);
            }
            else
            {
                // Exact substring matching with AND logic
                matchingProjectIds = allProjects
                    .Where(p => keywords.All(k => 
                        // Search in simple string fields
                        (p.Nom != null && p.Nom.ToLower().Contains(k)) || 
                        (p.Year.HasValue && p.Year.Value.ToString().Contains(k)) ||
                        (p.Client != null && p.Client.ToLower().Contains(k)) ||
                        (p.Domaine != null && p.Domaine.ToLower().Contains(k)) || 
                        (p.Role != null && p.Role.ToLower().Contains(k)) ||
                        
                        // Search in Perimetre dictionary keys
                        (p.Perimetre != null && p.Perimetre.Keys.Any(key => key.ToLower().Contains(k))) ||
                        
                        // Search in Perimetre dictionary values (which are lists of strings)
                        (p.Perimetre != null && p.Perimetre.Values.Any(values => 
                            values != null && values.Any(v => v.ToLower().Contains(k))))
                    ))
                    .Select(p => p.Id)
                    .ToList();
            }

            // Get all CVs with their projects so we can do the filtering in memory
            var allCvs = await _context.Cvs.AsNoTracking().ToListAsync(cancellationToken);
            
            // Filter CVs that contain any of the matching project IDs
            var matchingCvs = allCvs
                .Where(cv => cv.Projets != null && 
                             cv.Projets.Any(projectId => matchingProjectIds.Contains(projectId)))
                .ToList();

            // Convert to DTOs before pagination
            var dtos = MapToSearchResultDtoList(matchingCvs, matchingProjectIds);
            
            // Apply pagination
            return PaginatedList<CvSearchResultDto>.Create(
                dtos.AsQueryable(), 
                request.PageNumber, 
                request.PageSize);
        }

        // New method to perform fuzzy search with AND logic
        private List<Guid> PerformFuzzySearch(List<Projet> projects, List<string> keywords, int minimumScore)
        {
            var matchingProjectIds = new HashSet<Guid>();
            
            foreach (var project in projects)
            {
                // With AND logic - must match ALL keywords
                bool matchesAllKeywords = true;
                
                // For each keyword, check if it matches ANY field in the project
                foreach (var keyword in keywords)
                {
                    bool keywordMatchesAnyField = false;
                    
                    // Check Nom field
                    if (project.Nom != null && 
                        Fuzz.PartialRatio(project.Nom.ToLower(), keyword) >= minimumScore)
                    {
                        keywordMatchesAnyField = true;
                    }
                    // Check Year field
                    else if (project.Year.HasValue && 
                        Fuzz.PartialRatio(project.Year.Value.ToString(), keyword) >= minimumScore)
                    {
                        keywordMatchesAnyField = true;
                    }
                    // Check Client field
                    else if (project.Client != null && 
                        Fuzz.PartialRatio(project.Client.ToLower(), keyword) >= minimumScore)
                    {
                        keywordMatchesAnyField = true;
                    }
                    // Check Domaine field
                    else if (project.Domaine != null && 
                        Fuzz.PartialRatio(project.Domaine.ToLower(), keyword) >= minimumScore)
                    {
                        keywordMatchesAnyField = true;
                    }
                    // Check Role field
                    else if (project.Role != null && 
                        Fuzz.PartialRatio(project.Role.ToLower(), keyword) >= minimumScore)
                    {
                        keywordMatchesAnyField = true;
                    }
                    // Check Perimetre dictionary keys
                    else if (project.Perimetre != null)
                    {
                        foreach (var key in project.Perimetre.Keys)
                        {
                            if (Fuzz.PartialRatio(key.ToLower(), keyword) >= minimumScore)
                            {
                                keywordMatchesAnyField = true;
                                break;
                            }
                        }
                        
                        // If still no match, check Perimetre dictionary values
                        if (!keywordMatchesAnyField)
                        {
                            foreach (var values in project.Perimetre.Values)
                            {
                                if (values != null)
                                {
                                    foreach (var value in values)
                                    {
                                        if (Fuzz.PartialRatio(value.ToLower(), keyword) >= minimumScore)
                                        {
                                            keywordMatchesAnyField = true;
                                            break;
                                        }
                                    }
                                    
                                    if (keywordMatchesAnyField)
                                        break;
                                }
                            }
                        }
                    }
                    
                    // If this keyword doesn't match any field, the project doesn't match all keywords
                    if (!keywordMatchesAnyField)
                    {
                        matchesAllKeywords = false;
                        break;
                    }
                }
                
                // If project matches all keywords, add it to the results
                if (matchesAllKeywords)
                {
                    matchingProjectIds.Add(project.Id);
                }
            }
            
            return matchingProjectIds.ToList();
        }

        // Updated mapping method to convert entity to CvSearchResultDto
        private List<CvSearchResultDto> MapToSearchResultDtoList(List<Cv> cvs, List<Guid> matchingProjectIds)
        {
            return cvs.Select(cv =>
            {
                // For each CV, find the intersection of its projects and the matching project IDs
                var matchedProjectsForThisCv = cv.Projets != null 
                    ? cv.Projets.Where(projectId => matchingProjectIds.Contains(projectId)).ToList()
                    : new List<Guid>();

                return new CvSearchResultDto
                {
                    Id = cv.Id,
                    Id_user = cv.Id_user,
                    Presentation = cv.Presentation,
                    documentUrl = cv.documentUrl,
                    Formations = cv.Formations?.ToList(),
                    LanguesPratiquees = cv.LanguesPratiquees?.ToDictionary(kv => kv.Key, kv => kv.Value),
                    Experiences = cv.Experiences?.ToList(),
                    Certifications = cv.Certifications?.ToList(),
                    Projets = cv.Projets?.ToList(),
                    // Add the matching project IDs for this CV
                    MatchedProjectIds = matchedProjectsForThisCv
                };
            }).ToList();
        }
    }
}