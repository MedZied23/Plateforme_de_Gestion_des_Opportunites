using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class addedDepenseFunctionnalities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalDepense",
                table: "Profils",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitsDepense",
                table: "Profils",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalDepense",
                table: "Profils");

            migrationBuilder.DropColumn(
                name: "UnitsDepense",
                table: "Profils");
        }
    }
}
