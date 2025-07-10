﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentaireToOpportunite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Commentaire",
                table: "Opportunites",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Commentaire",
                table: "Opportunites");
        }
    }
}
