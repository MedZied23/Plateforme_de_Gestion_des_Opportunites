using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserCvCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cvs_Users_Id_user",
                table: "Cvs");

            migrationBuilder.AddForeignKey(
                name: "FK_Cvs_Users_Id_user",
                table: "Cvs",
                column: "Id_user",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cvs_Users_Id_user",
                table: "Cvs");

            migrationBuilder.AddForeignKey(
                name: "FK_Cvs_Users_Id_user",
                table: "Cvs",
                column: "Id_user",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
