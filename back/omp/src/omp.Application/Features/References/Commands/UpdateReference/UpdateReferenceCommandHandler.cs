using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using omp.Application.Common.Interfaces;
using omp.Application.Features.References.DTOs;
using omp.Domain.Entites;
using System.Linq; // Added for Linq operations
using System.Collections.Generic; // Added for Dictionary

namespace omp.Application.Features.References.Commands.UpdateReference
{
    public class UpdateReferenceCommandHandler : IRequestHandler<UpdateReferenceCommand, ReferenceDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public UpdateReferenceCommandHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ReferenceDto> Handle(UpdateReferenceCommand request, CancellationToken cancellationToken)
        {
            var reference = await _context.References
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);
            if (reference == null)
            {
                throw new Exception($"Reference with ID {request.Id} not found");
            }

            // Update reference properties
            reference.Nom = request.Nom;
            reference.Country = request.Country;
            reference.Offre = request.Offre;
            reference.Client = request.Client;
            reference.Budget = request.Budget;
            reference.DateDebut = request.DateDebut;
            reference.DateFin = request.DateFin;
            reference.Equipe = request.Equipe;
            reference.Description = request.Description;
            reference.Services = request.Services;
            reference.DocumentUrl = request.DocumentUrl;
            reference.LastModified = DateTime.UtcNow;

            _context.References.Update(reference);

            // Update or create associated projets in CVs
            if (reference.Equipe != null)
            {
                foreach (var membreEquipe in reference.Equipe)
                {
                    var cv = await _context.Cvs
                        .FirstOrDefaultAsync(c => c.Id_user == membreEquipe.Key, cancellationToken);

                    if (cv != null)
                    {
                        var projet = await _context.Projets
                            .FirstOrDefaultAsync(p => p.ReferenceId == reference.Id && p.CvId == cv.Id, cancellationToken);

                        if (projet != null)
                        {
                            // Update existing projet
                            projet.Nom = reference.Nom;
                            projet.Year = reference.DateDebut?.Year;
                            projet.Domaine = reference.Offre;
                            projet.Perimetre = reference.Services?.SelectMany(s => s.Value)
                                .GroupBy(kvp => kvp.Key)
                                .ToDictionary(g => g.Key, g => g.SelectMany(kvp => kvp.Value).ToList());
                            projet.Role = membreEquipe.Value;
                            projet.Client = reference.Client;
                            _context.Projets.Update(projet);
                        }
                        else
                        {
                            // Create new projet if it doesn't exist
                            var newProjet = new Projet
                            {
                                Id = Guid.NewGuid(),
                                CvId = cv.Id,
                                Nom = reference.Nom,
                                Year = reference.DateDebut?.Year,
                                Domaine = reference.Offre,
                                Perimetre = reference.Services?.SelectMany(s => s.Value)
                                    .GroupBy(kvp => kvp.Key)
                                    .ToDictionary(g => g.Key, g => g.SelectMany(kvp => kvp.Value).ToList()),
                                Role = membreEquipe.Value,
                                Hide = false,
                                ReferenceId = reference.Id,
                                Client = reference.Client
                            };
                            await _context.Projets.AddAsync(newProjet, cancellationToken);
                            if (cv.Projets == null)
                            {
                                cv.Projets = new List<Guid>();
                            }
                            cv.Projets.Add(newProjet.Id);
                            _context.Cvs.Update(cv);
                        }
                    }
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            return _mapper.Map<ReferenceDto>(reference);
        }
    }
}