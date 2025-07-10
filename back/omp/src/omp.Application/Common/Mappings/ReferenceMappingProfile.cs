using AutoMapper;
using omp.Application.Features.References.DTOs;
using omp.Domain.Entites;

namespace omp.Application.Common.Mappings
{
    public class ReferenceMappingProfile : Profile
    {
        public ReferenceMappingProfile()
        {
            CreateMap<Reference, ReferenceDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Nom, opt => opt.MapFrom(src => src.Nom))
                .ForMember(dest => dest.Country, opt => opt.MapFrom(src => src.Country))
                .ForMember(dest => dest.Offre, opt => opt.MapFrom(src => src.Offre))
                .ForMember(dest => dest.Client, opt => opt.MapFrom(src => src.Client))
                .ForMember(dest => dest.Budget, opt => opt.MapFrom(src => src.Budget))
                .ForMember(dest => dest.DateDebut, opt => opt.MapFrom(src => src.DateDebut))
                .ForMember(dest => dest.DateFin, opt => opt.MapFrom(src => src.DateFin))
                .ForMember(dest => dest.Equipe, opt => opt.MapFrom(src => src.Equipe))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.Services, opt => opt.MapFrom(src => src.Services))
                .ForMember(dest => dest.DocumentUrl, opt => opt.MapFrom(src => src.DocumentUrl))
                .ForMember(dest => dest.LastModified, opt => opt.MapFrom(src => src.LastModified))
                .ForMember(dest => dest.LastAccessed, opt => opt.MapFrom(src => src.LastAccessed));

            CreateMap<ReferenceDto, Reference>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Nom, opt => opt.MapFrom(src => src.Nom))
                .ForMember(dest => dest.Country, opt => opt.MapFrom(src => src.Country))
                .ForMember(dest => dest.Offre, opt => opt.MapFrom(src => src.Offre))
                .ForMember(dest => dest.Client, opt => opt.MapFrom(src => src.Client))
                .ForMember(dest => dest.Budget, opt => opt.MapFrom(src => src.Budget))
                .ForMember(dest => dest.DateDebut, opt => opt.MapFrom(src => src.DateDebut))
                .ForMember(dest => dest.DateFin, opt => opt.MapFrom(src => src.DateFin))
                .ForMember(dest => dest.Equipe, opt => opt.MapFrom(src => src.Equipe))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.Services, opt => opt.MapFrom(src => src.Services))
                .ForMember(dest => dest.DocumentUrl, opt => opt.MapFrom(src => src.DocumentUrl))
                .ForMember(dest => dest.LastModified, opt => opt.MapFrom(src => src.LastModified))
                .ForMember(dest => dest.LastAccessed, opt => opt.MapFrom(src => src.LastAccessed));
        }
    }
}
