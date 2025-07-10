using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class addedcascadedeletedforopportunitetask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_OpportuniteTasks_OpportuniteId",
                table: "OpportuniteTasks",
                column: "OpportuniteId");

            migrationBuilder.AddForeignKey(
                name: "FK_OpportuniteTasks_Opportunites_OpportuniteId",
                table: "OpportuniteTasks",
                column: "OpportuniteId",
                principalTable: "Opportunites",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OpportuniteTasks_Opportunites_OpportuniteId",
                table: "OpportuniteTasks");

            migrationBuilder.DropIndex(
                name: "IX_OpportuniteTasks_OpportuniteId",
                table: "OpportuniteTasks");
        }
    }
}
