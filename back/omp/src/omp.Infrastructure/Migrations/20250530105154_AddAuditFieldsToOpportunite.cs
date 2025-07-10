using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFieldsToOpportunite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedBy",
                table: "Opportunites",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "DateCreated",
                table: "Opportunites",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "LastModified",
                table: "Opportunites",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LastModifiedBy",
                table: "Opportunites",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Opportunites");

            migrationBuilder.DropColumn(
                name: "DateCreated",
                table: "Opportunites");

            migrationBuilder.DropColumn(
                name: "LastModified",
                table: "Opportunites");

            migrationBuilder.DropColumn(
                name: "LastModifiedBy",
                table: "Opportunites");
        }
    }
}
