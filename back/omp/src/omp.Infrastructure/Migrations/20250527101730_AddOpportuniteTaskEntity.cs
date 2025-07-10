using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOpportuniteTaskEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OpportuniteTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OpportuniteId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: true),
                    Equipe = table.Column<string>(type: "text", nullable: true),
                    DateAssigned = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateDone = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Percentage = table.Column<double>(type: "double precision", nullable: true),
                    Numero = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpportuniteTasks", x => x.Id);
                    table.CheckConstraint("CK_OpportuniteTask_Numero", "\"Numero\" IS NULL OR \"Numero\" >= 1");
                    table.CheckConstraint("CK_OpportuniteTask_Percentage", "\"Percentage\" IS NULL OR (\"Percentage\" >= 0 AND \"Percentage\" <= 100)");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OpportuniteTasks");
        }
    }
}
