using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentaireAndStatusToPropositionFinanciere : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Commentaire",
                table: "PropositionsFinancieres",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "PropositionsFinancieres",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Commentaire",
                table: "PropositionsFinancieres");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "PropositionsFinancieres");
        }
    }
}
