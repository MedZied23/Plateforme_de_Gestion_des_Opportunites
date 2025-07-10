# OMP - Opportunity Management Platform

A comprehensive .NET Web API application for managing opportunities, projects, and references with PostgreSQL database and Azure Blob Storage integration.

## Prerequisites

### .NET Version Required
- **[.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)** or later

### Additional Requirements
- **[PostgreSQL](https://www.postgresql.org/download/)** database server (version 12 or later)
- **[Visual Studio 2022](https://visualstudio.microsoft.com/)** or **[Visual Studio Code](https://code.visualstudio.com/)** (recommended)
- **Azure Storage Account** (for blob storage functionality)

## Database Setup

### 1. Install PostgreSQL
- Download and install PostgreSQL from the official website
- Remember the username and password you set during installation

### 2. Create Database
Connect to PostgreSQL and create the application database:
```sql
CREATE DATABASE ompDB;
```

### 3. Configure Connection String
Update the connection string in the configuration files:
- `src/omp.API/appsettings.json` (for development)
- `src/omp.API/appsettings.Development.json` (for development environment)

Default connection string format:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=ompDB;Username=postgres;Password=root"
  }
}
```

## Steps to Run the Application

### Option 1: Using Docker (Recommended)

#### Prerequisites for Docker
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** installed and running
- **[Docker Compose](https://docs.docker.com/compose/install/)** (included with Docker Desktop)

#### Quick Start with Docker
```powershell
# Navigate to the project directory
cd c:\omp\back\omp

# Build and start all services (API + PostgreSQL)
docker-compose up --build

# Or run in detached mode (background)
docker-compose up --build -d

# Stop the services
docker-compose down

# Stop and remove all data (including database)
docker-compose down -v
```

#### Development with Docker
```powershell
# Run in development mode with hot reload
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build

# View logs
docker-compose logs -f omp-api

# Access the database directly
docker-compose exec postgres psql -U postgres -d ompDB
```

### Option 2: Manual Setup (Traditional)

#### 1. Clone and Navigate
```powershell
# Navigate to the project directory
cd c:\omp\back\omp
```

#### 2. Restore Dependencies
```powershell
# Restore NuGet packages for all projects
dotnet restore
```

#### 3. Build the Solution
```powershell
# Build the entire solution
dotnet build
```

#### 4. Database Migration
Navigate to the API project and apply database migrations:
```powershell
# Navigate to the API project
cd src\omp.API

# Apply database migrations to create tables
dotnet ef database update
```

#### 5. Run the Application
```powershell
# Run the API application
dotnet run
```

### 6. Access the Application

#### When using Docker:
- **HTTP**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger (for API documentation and testing)
- **With Nginx** (if enabled): http://localhost:80

#### When using manual setup:
- **HTTP**: http://localhost:5087
- **HTTPS**: https://localhost:7142
- **Swagger UI**: https://localhost:7142/swagger (for API documentation and testing)

## Configuration

### Environment Variables
The application uses the following configuration settings that can be modified in `appsettings.json`:

#### Database
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=ompDB;Username=postgres;Password=root"
  }
}
```

#### JWT Authentication
```json
{
  "Jwt": {
    "Key": "your-super-secret-key-with-at-least-256-bits-length",
    "Issuer": "omp-api",
    "Audience": "omp-client",
    "DurationInHours": 12
  }
}
```

#### Default Admin User
```json
{
  "DefaultAdmin": {
    "Email": "admin@omp.com",
    "Password": "Admin@123!",
    "FirstName": "System",
    "LastName": "Administrator",
    "Phone": "+1234567890"
  }
}
```

## Project Structure

```
omp/
├── src/
│   ├── omp.API/           # Web API controllers and configuration
│   ├── omp.Application/   # Business logic and application services
│   ├── omp.Domain/        # Domain entities and business rules
│   └── omp.Infrastructure/ # Data access and external services
├── PasswordHasher/        # Utility project for password hashing
├── nginx/                 # Nginx configuration files
└── publish/              # Published application files
```

## Development Commands

### Docker Commands
```powershell
# Build the Docker image
docker-compose build

# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose stop

# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes (including database data)
docker-compose down -v

# Rebuild and restart a specific service
docker-compose up --build omp-api

# Execute commands inside running containers
docker-compose exec omp-api dotnet --version
docker-compose exec postgres psql -U postgres -d ompDB

# Run database migrations in Docker
docker-compose exec omp-api dotnet ef database update --project src/omp.API

# Scale services (if needed)
docker-compose up --scale omp-api=2
```

### Entity Framework Commands
```powershell
# Navigate to API project
cd src\omp.API

# Add new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Remove last migration
dotnet ef migrations remove
```

### Running Specific Environments
```powershell
# Run in Development environment
dotnet run --environment Development

# Run in Production environment
dotnet run --environment Production
```

## Troubleshooting

### Docker-Related Issues

1. **Build Failures with dotnet restore**
   - The Dockerfile uses multi-stage builds and proper layer caching
   - Project files are copied first, then dependencies are restored
   - This solves most `dotnet restore` issues in Docker builds

2. **Port Already in Use**
   - Stop conflicting services: `docker-compose down`
   - Check what's using the port: `netstat -an | findstr :8080`
   - Modify ports in `docker-compose.yml` if needed

3. **Database Connection Issues**
   - Ensure PostgreSQL container is healthy: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`
   - Verify connection string in docker-compose.yml

4. **Container Won't Start**
   - Check logs: `docker-compose logs omp-api`
   - Verify environment variables in docker-compose.yml
   - Ensure all required dependencies are running

### Common Issues

1. **PostgreSQL Connection Error**
   - Ensure PostgreSQL service is running
   - Verify connection string credentials
   - Check if the database exists

2. **Port Already in Use**
   - Change the port in `Properties/launchSettings.json`
   - Or stop the process using the port

3. **Migration Errors**
   - Ensure database is accessible
   - Check Entity Framework tools are installed: `dotnet tool install --global dotnet-ef`

### Useful Commands
```powershell
# Check .NET version
dotnet --version

# List installed SDKs
dotnet --list-sdks

# Clean and rebuild
dotnet clean
dotnet build

# Run with verbose logging
dotnet run --verbosity detailed
```

## Additional Tools

### Password Hasher Utility
The project includes a separate `PasswordHasher` utility for generating secure password hashes:
```powershell
cd PasswordHasher
dotnet run
```

## Contributing

1. Follow the established project structure
2. Use Entity Framework for database operations
3. Implement proper error handling and validation
4. Update migrations when modifying entities
5. Test your changes thoroughly

## License

[Add your license information here]
