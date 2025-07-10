using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveClientIdAddClientTextWithoutMaxLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_References_Clients_ClientId",
                table: "References");

            migrationBuilder.DropIndex(
                name: "IX_References_ClientId",
                table: "References");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "References");

            migrationBuilder.AddColumn<string>(
                name: "Client",
                table: "References",
                type: "text",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Client",
                table: "References");

            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "References",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_References_ClientId",
                table: "References",
                column: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_References_Clients_ClientId",
                table: "References",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
