using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using omp.Application.Features.References.DTOs;
using omp.Domain.Entites;
using omp.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore; // Added for Include and FirstOrDefaultAsync
using System.Linq; // Added for Linq operations
using System.Collections.Generic; // Added for Dictionary

namespace omp.Application.Features.References.Commands.CreateReference
{
    public class CreateReferenceCommandHandler : IRequestHandler<CreateReferenceCommand, ReferenceDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CreateReferenceCommandHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ReferenceDto> Handle(CreateReferenceCommand request, CancellationToken cancellationToken)
        {            var reference = new Reference
            {
                Id = Guid.NewGuid(),
                Nom = request.Nom,
                Country = request.Country,
                Offre = request.Offre,
                Client = request.Client,
                Budget = request.Budget,
                DateDebut = request.DateDebut,
                DateFin = request.DateFin,
                Equipe = request.Equipe,
                Description = request.Description,
                Services = request.Services,
                DocumentUrl = request.DocumentUrl,
                LastModified = DateTime.UtcNow,
                LastAccessed = DateTime.UtcNow
            };

            await _context.References.AddAsync(reference, cancellationToken);
            

            if (reference.Equipe != null)
            {
                foreach (var membreEquipe in reference.Equipe)
                {
                    var cv = await _context.Cvs
                        .FirstOrDefaultAsync(c => c.Id_user == membreEquipe.Key, cancellationToken);

                    if (cv != null)
                    {
                        var projet = new Projet
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

                        await _context.Projets.AddAsync(projet, cancellationToken);
                        if (cv.Projets == null)
                        {
                            cv.Projets = new List<Guid>();
                        }
                        cv.Projets.Add(projet.Id);
                        _context.Cvs.Update(cv);
                    }
                }
            }
            await _context.SaveChangesAsync(cancellationToken);
            return _mapper.Map<ReferenceDto>(reference);
        }
    }
}