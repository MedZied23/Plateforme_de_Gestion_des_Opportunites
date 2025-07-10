# Makefile for OMP Frontend Docker operations

.PHONY: help build build-dev run run-dev stop clean logs

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build production Docker image"
	@echo "  build-dev - Build development Docker image"
	@echo "  run       - Run production container with Docker Compose"
	@echo "  run-dev   - Run development container with Docker Compose"
	@echo "  stop      - Stop all containers"
	@echo "  clean     - Remove containers and images"
	@echo "  logs      - Show container logs"
	@echo "  help      - Show this help message"

# Build production image
build:
	docker-compose build

# Build development image
build-dev:
	docker-compose --profile dev build

# Run production container
run:
	docker-compose up -d

# Run development container
run-dev:
	docker-compose --profile dev up -d

# Stop all containers
stop:
	docker-compose down

# Clean up containers and images
clean:
	docker-compose down --rmi all --volumes --remove-orphans
	docker system prune -f

# Show logs
logs:
	docker-compose logs -f

# Quick development setup
dev-setup: build-dev run-dev
	@echo "Development environment is ready at http://localhost:4200"

# Quick production setup
prod-setup: build run
	@echo "Production environment is ready at http://localhost:80"
