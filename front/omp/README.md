# Omp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.8.

## Docker Setup

This application has been dockerized for easy deployment and development.

### Prerequisites

- Docker
- Docker Compose

### Production Deployment

To build and run the application in production mode:

```bash
# Build and start the production container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at `http://localhost:80`.

### Development with Docker

To run the application in development mode with hot reload:

```bash
# Start the development container
docker-compose --profile dev up --build

# Or run in detached mode
docker-compose --profile dev up -d --build
```

The development server will be available at `http://localhost:4200`.

### Docker Commands

```bash
# Build production image
docker build -t omp-frontend .

# Build development image
docker build -f Dockerfile.dev -t omp-frontend-dev .

# Run production container
docker run -p 80:80 omp-frontend

# Run development container
docker run -p 4200:4200 -v $(pwd):/app -v /app/node_modules omp-frontend-dev

# Stop all containers
docker-compose down

# Remove all containers and images
docker-compose down --rmi all
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
