# Use the official .NET 9.0 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /app

# Copy solution file
COPY omp.sln ./

# Copy all project files first (this helps with Docker layer caching)
COPY src/omp.API/omp.API.csproj src/omp.API/
COPY src/omp.Application/omp.Application.csproj src/omp.Application/
COPY src/omp.Domain/omp.Domain.csproj src/omp.Domain/
COPY src/omp.Infrastructure/omp.Infrastructure.csproj src/omp.Infrastructure/

# Restore packages (this layer will be cached if project files haven't changed)
RUN dotnet restore

# Copy the rest of the source code
COPY src/ src/

# Build the application
RUN dotnet build -c Release --no-restore

# Publish the application
RUN dotnet publish src/omp.API/omp.API.csproj -c Release -o /app/publish --no-restore

# Use the official .NET 9.0 ASP.NET runtime image for running
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install PostgreSQL client for health checks (optional)
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy the published application
COPY --from=build-env /app/publish .

# Create a non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Expose the port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://*:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
ENTRYPOINT ["dotnet", "omp.API.dll"]
