using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDoneAndNatureToOpportuniteTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Done",
                table: "OpportuniteTasks",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Nature",
                table: "OpportuniteTasks",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Done",
                table: "OpportuniteTasks");

            migrationBuilder.DropColumn(
                name: "Nature",
                table: "OpportuniteTasks");
        }
    }
}
