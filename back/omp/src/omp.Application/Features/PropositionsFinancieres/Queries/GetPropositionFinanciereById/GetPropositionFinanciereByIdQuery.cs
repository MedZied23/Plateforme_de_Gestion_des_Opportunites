using System;
using MediatR;
using omp.Application.Features.PropositionsFinancieres.DTOs;

namespace omp.Application.Features.PropositionsFinancieres.Queries.GetPropositionFinanciereById
{
    public class GetPropositionFinanciereByIdQuery : IRequest<PropositionFinanciereDto>
    {
        public Guid Id { get; set; }
    }
}