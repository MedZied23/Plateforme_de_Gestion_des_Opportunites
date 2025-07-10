using System;
using MediatR;

namespace omp.Application.Features.PropositionsFinancieres.Commands.DeletePropositionFinanciere
{
    public class DeletePropositionFinanciereCommand : IRequest<bool>
    {
        public Guid Id { get; set; }
    }
}