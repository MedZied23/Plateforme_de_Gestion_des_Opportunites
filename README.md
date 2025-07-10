# Plateforme de Gestion des Opportunités (OMP)

## Security Notice

⚠️ **IMPORTANT**: This repository has been cleaned of sensitive information that was accidentally committed in the initial version.

### What was removed:
- Azure Storage Account Access Keys
- JWT secret keys
- Database connection strings with passwords
- Default admin passwords
- All build artifacts (`bin/`, `obj/`, `publish/` directories)

### Security Best Practices Implemented:

1. **Comprehensive .gitignore**: Added extensive .gitignore rules to prevent future commits of:
   - Build outputs (`bin/`, `obj/`, `publish/`)
   - Configuration files with secrets (`appsettings.json`, `appsettings.*.json`)
   - Environment files (`.env`, `.env.local`, etc.)
   - User secrets (`secrets.json`)

2. **Configuration Templates**: Created `appsettings.template.json` files as examples without sensitive data

3. **Environment Variables**: Use environment variables for sensitive configuration in production

### Setting Up the Project:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MedZied23/Plateforme_de_Gestion_des_Opportunites.git
   cd Plateforme_de_Gestion_des_Opportunites
   ```

2. **Backend Setup**:
   ```bash
   cd back/omp/src/omp.API
   cp appsettings.template.json appsettings.json
   cp appsettings.template.json appsettings.Development.json
   ```

3. **Configure your settings**: Edit the copied `appsettings.json` files with your actual configuration:
   - Set your database connection string
   - Configure Azure Blob Storage credentials
   - Set a secure JWT key (at least 256 bits)
   - Configure default admin credentials

4. **Use Environment Variables in Production**:
   ```bash
   export AZURE_STORAGE_CONNECTION_STRING="your_connection_string"
   export AZURE_STORAGE_ACCOUNT_KEY="your_account_key"
   export JWT_KEY="your_secure_jwt_key"
   export ADMIN_PASSWORD="your_secure_admin_password"
   ```

### Alternative Security Approaches:

1. **Azure Key Vault**: Store secrets in Azure Key Vault and reference them in your application
2. **User Secrets**: Use .NET User Secrets for development environments
3. **Docker Secrets**: Use Docker secrets for containerized deployments

### Project Structure:

```
├── back/omp/               # Backend .NET API
│   ├── src/
│   │   ├── omp.API/       # Main API project
│   │   ├── omp.Application/ # Application layer
│   │   ├── omp.Domain/    # Domain layer
│   │   └── omp.Infrastructure/ # Infrastructure layer
│   └── docker-compose.yml
├── front/omp/             # Frontend Angular application
└── docker-compose.yml    # Main docker compose
```

### Development:

1. **Backend**: ASP.NET Core 9.0 API with Entity Framework
2. **Frontend**: Angular application
3. **Database**: PostgreSQL
4. **Storage**: Azure Blob Storage
5. **Architecture**: Clean Architecture with CQRS pattern

### Important Notes:

- Never commit secrets or sensitive information to version control
- Always use environment variables or secure vaults for production secrets
- Regularly rotate credentials and access keys
- Monitor your repositories for accidental secret commits

---

**Note**: The git history has been completely rewritten to remove all traces of the committed secrets. If you had a previous clone, you'll need to re-clone the repository.
