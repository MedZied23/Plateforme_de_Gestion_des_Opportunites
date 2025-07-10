using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace omp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class mayThisBeAGoodMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BailleursDeFonds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NomBailleur = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Modele = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BailleursDeFonds", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NomClient = table.Column<string>(type: "text", nullable: true),
                    ContactNom = table.Column<string>(type: "text", nullable: true),
                    Pays = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: true),
                    Adresse = table.Column<string>(type: "text", nullable: true),
                    Telephone = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Partenaires",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: true),
                    Nom = table.Column<string>(type: "text", nullable: true),
                    Domaine = table.Column<string>(type: "text", nullable: true),
                    ContactCle = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partenaires", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Phases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Numero = table.Column<int>(type: "integer", nullable: true),
                    Nom = table.Column<string>(type: "text", nullable: true),
                    TotalParPhase = table.Column<int>(type: "integer", nullable: true),
                    Pourcentage = table.Column<decimal>(type: "numeric", nullable: true),
                    IdPropositionFinanciere = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Phases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PropositionsFinancieres",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nom = table.Column<string>(type: "text", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateModification = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    nbrSemaines = table.Column<int>(type: "integer", nullable: true),
                    MatricePL = table.Column<string>(type: "text", nullable: true),
                    MatricePLSiege = table.Column<string>(type: "text", nullable: true),
                    MatricePLTerrain = table.Column<string>(type: "text", nullable: true),
                    MatricePLSiegeParJour = table.Column<string>(type: "text", nullable: true),
                    MatricePLTerrainParJour = table.Column<string>(type: "text", nullable: true),
                    TotalCost = table.Column<int>(type: "integer", nullable: true),
                    AverageTJM = table.Column<decimal>(type: "numeric", nullable: true),
                    SumHJ = table.Column<int>(type: "integer", nullable: true),
                    BudgetPartEY = table.Column<int>(type: "integer", nullable: true),
                    BudgetsPartenaires = table.Column<string>(type: "text", nullable: true),
                    NbrHJPartEY = table.Column<int>(type: "integer", nullable: true),
                    NbrHJPartenaires = table.Column<string>(type: "text", nullable: true),
                    PourcentHjEY = table.Column<decimal>(type: "numeric", nullable: true),
                    PourcentHjPartenaires = table.Column<string>(type: "text", nullable: true),
                    PourcentBudgetEY = table.Column<decimal>(type: "numeric", nullable: true),
                    PourcentBudgetPartenaires = table.Column<string>(type: "text", nullable: true),
                    TotalExpenses = table.Column<int>(type: "integer", nullable: true),
                    TotalProjet = table.Column<int>(type: "integer", nullable: true),
                    NbrJoursParMois = table.Column<decimal>(type: "numeric", nullable: true),
                    prixDepenses = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropositionsFinancieres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Prenom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Password = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    role = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Livrables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nom = table.Column<string>(type: "text", nullable: true),
                    Numero = table.Column<int>(type: "integer", nullable: true),
                    StartWeek = table.Column<int>(type: "integer", nullable: true),
                    EndWeek = table.Column<int>(type: "integer", nullable: true),
                    Duration = table.Column<int>(type: "integer", nullable: true),
                    TotalParLivrable = table.Column<int>(type: "integer", nullable: true),
                    Pourcentage = table.Column<decimal>(type: "numeric", nullable: true),
                    IdPhase = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Livrables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Livrables_Phases_IdPhase",
                        column: x => x.IdPhase,
                        principalTable: "Phases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Opportunites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NomOpportunite = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    PartnerExists = table.Column<bool>(type: "boolean", nullable: true),
                    PartenaireId = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Nature = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Pays = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Duree = table.Column<int>(type: "integer", nullable: true),
                    BailleurExists = table.Column<bool>(type: "boolean", nullable: true),
                    IdBailleurDeFonds = table.Column<string>(type: "text", nullable: true),
                    AssocieEnCharge = table.Column<Guid>(type: "uuid", nullable: true),
                    ManagerEnCharge = table.Column<Guid>(type: "uuid", nullable: true),
                    EquipeProjet = table.Column<string>(type: "text", nullable: true),
                    Monnaie = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Offre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IdPropositionFinanciere = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Opportunites", x => x.Id);
                    table.CheckConstraint("CK_Opportunite_Duree", "\"Duree\" IS NULL OR \"Duree\" >= 0");
                    table.CheckConstraint("CK_Opportunite_PartnerExists", "\"PartnerExists\" IS NULL OR \"PartnerExists\" = false OR (\"PartnerExists\" = true AND \"PartenaireId\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_Opportunites_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Opportunites_PropositionsFinancieres_IdPropositionFinanciere",
                        column: x => x.IdPropositionFinanciere,
                        principalTable: "PropositionsFinancieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Profils",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NomPrenom = table.Column<string>(type: "text", nullable: true),
                    Numero = table.Column<int>(type: "integer", nullable: true),
                    Poste = table.Column<string>(type: "text", nullable: true),
                    TJM = table.Column<int>(type: "integer", nullable: true),
                    TotalParProfil = table.Column<int>(type: "integer", nullable: true),
                    TotalCostParProfil = table.Column<int>(type: "integer", nullable: true),
                    TotalSiege = table.Column<int>(type: "integer", nullable: true),
                    TotalTerrain = table.Column<int>(type: "integer", nullable: true),
                    TotalSiegeParJour = table.Column<decimal>(type: "numeric", nullable: true),
                    TotalTerrainParJour = table.Column<decimal>(type: "numeric", nullable: true),
                    IdPartenaire = table.Column<Guid>(type: "uuid", nullable: true),
                    IdPropositionFinanciere = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Profils", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Profils_Partenaires_IdPartenaire",
                        column: x => x.IdPartenaire,
                        principalTable: "Partenaires",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Profils_PropositionsFinancieres_IdPropositionFinanciere",
                        column: x => x.IdPropositionFinanciere,
                        principalTable: "PropositionsFinancieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Cvs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Id_user = table.Column<Guid>(type: "uuid", nullable: true),
                    Presentation = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Formations = table.Column<string>(type: "text", nullable: true),
                    LanguesPratiquees = table.Column<string>(type: "text", nullable: true),
                    Experiences = table.Column<string>(type: "text", nullable: true),
                    Certifications = table.Column<string>(type: "text", nullable: true),
                    Projets = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cvs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cvs_Users_Id_user",
                        column: x => x.Id_user,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Experiences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Employer = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Poste = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CvId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Experiences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Experiences_Cvs_CvId",
                        column: x => x.CvId,
                        principalTable: "Cvs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Formations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Diplome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Institution = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CvId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Formations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Formations_Cvs_CvId",
                        column: x => x.CvId,
                        principalTable: "Cvs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Projets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nom = table.Column<string>(type: "text", nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Client = table.Column<string>(type: "text", nullable: true),
                    Domaine = table.Column<string>(type: "text", nullable: true),
                    Perimetre = table.Column<string>(type: "text", nullable: true),
                    Role = table.Column<string>(type: "text", nullable: true),
                    CvId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Projets_Cvs_CvId",
                        column: x => x.CvId,
                        principalTable: "Cvs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cvs_Id_user",
                table: "Cvs",
                column: "Id_user",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Experiences_CvId",
                table: "Experiences",
                column: "CvId");

            migrationBuilder.CreateIndex(
                name: "IX_Formations_CvId",
                table: "Formations",
                column: "CvId");

            migrationBuilder.CreateIndex(
                name: "IX_Livrables_IdPhase",
                table: "Livrables",
                column: "IdPhase");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunites_ClientId",
                table: "Opportunites",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunites_IdPropositionFinanciere",
                table: "Opportunites",
                column: "IdPropositionFinanciere",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Profils_IdPartenaire",
                table: "Profils",
                column: "IdPartenaire");

            migrationBuilder.CreateIndex(
                name: "IX_Profils_IdPropositionFinanciere",
                table: "Profils",
                column: "IdPropositionFinanciere");

            migrationBuilder.CreateIndex(
                name: "IX_Projets_CvId",
                table: "Projets",
                column: "CvId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BailleursDeFonds");

            migrationBuilder.DropTable(
                name: "Experiences");

            migrationBuilder.DropTable(
                name: "Formations");

            migrationBuilder.DropTable(
                name: "Livrables");

            migrationBuilder.DropTable(
                name: "Opportunites");

            migrationBuilder.DropTable(
                name: "Profils");

            migrationBuilder.DropTable(
                name: "Projets");

            migrationBuilder.DropTable(
                name: "Phases");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "Partenaires");

            migrationBuilder.DropTable(
                name: "PropositionsFinancieres");

            migrationBuilder.DropTable(
                name: "Cvs");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
