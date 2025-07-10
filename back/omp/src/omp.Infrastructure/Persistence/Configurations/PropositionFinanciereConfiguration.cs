using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using omp.Domain.Entites;
using System;
using System.Collections.Generic;
using System.Text.Json;

namespace omp.Infrastructure.Persistence.Configurations
{
    public class PropositionFinanciereConfiguration : IEntityTypeConfiguration<PropositionFinanciere>
    {
        public void Configure(EntityTypeBuilder<PropositionFinanciere> builder)
        {
            builder.HasKey(p => p.Id);

            // Configure collection properties as JSON strings
            builder.Property(p => p.MatricePL)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<List<int>>>(v, JsonSerializerOptions.Default) ?? new List<List<int>>()
                );

            builder.Property(p => p.MatricePLSiege)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<List<int>>>(v, JsonSerializerOptions.Default) ?? new List<List<int>>()
                );

            builder.Property(p => p.MatricePLTerrain)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<List<int>>>(v, JsonSerializerOptions.Default) ?? new List<List<int>>()
                );

            builder.Property(p => p.MatricePLSiegeParJour)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<List<decimal>>>(v, JsonSerializerOptions.Default) ?? new List<List<decimal>>()
                );

            builder.Property(p => p.MatricePLTerrainParJour)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<List<decimal>>>(v, JsonSerializerOptions.Default) ?? new List<List<decimal>>()
                );

            builder.Property(p => p.BudgetsPartenaires)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<Guid, int>>(v, JsonSerializerOptions.Default) ?? new Dictionary<Guid, int>()
                );

            builder.Property(p => p.NbrHJPartenaires)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<Guid, int>>(v, JsonSerializerOptions.Default) ?? new Dictionary<Guid, int>()
                );

            builder.Property(p => p.PourcentHjPartenaires)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<Guid, decimal>>(v, JsonSerializerOptions.Default) ?? new Dictionary<Guid, decimal>()
                );

            builder.Property(p => p.PourcentBudgetPartenaires)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<Guid, decimal>>(v, JsonSerializerOptions.Default) ?? new Dictionary<Guid, decimal>()
                );

            builder.Property(p => p.prixDepenses)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<Dictionary<TypeDepense, int>>(v, JsonSerializerOptions.Default) ?? new Dictionary<TypeDepense, int>()
                );
        }
    }
}