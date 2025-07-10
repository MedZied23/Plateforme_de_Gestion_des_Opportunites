using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReferenceIdToProjet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReferenceId",
                table: "Projets",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projets_ReferenceId",
                table: "Projets",
                column: "ReferenceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projets_References_ReferenceId",
                table: "Projets",
                column: "ReferenceId",
                principalTable: "References",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projets_References_ReferenceId",
                table: "Projets");

            migrationBuilder.DropIndex(
                name: "IX_Projets_ReferenceId",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "ReferenceId",
                table: "Projets");
        }
    }
}
