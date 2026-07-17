# Resilient User Profile Management API

A robust, fault-tolerant backend API for managing user profiles, featuring a clean layered architecture, a data persistence layer using the Repository and Unit of Work patterns, and integration with an external mock service protected by Retry and Circuit Breaker mechanisms.

## Project Overview

This API allows for standard CRUD operations on User profiles. Additionally, it features an endpoint that fetches enriched user data from an external mock service. The mock service is designed to simulate an unreliable network by occasionally failing or delaying responses. The API handles these failures gracefully using resilient patterns:

- **Retry Pattern**: Automatically retries transient failures with an exponential backoff before giving up.
- **Circuit Breaker Pattern**: Monitors failure rates. If the external service fails consistently, the circuit "opens" to prevent cascading failures, quickly returning a fallback response instead of waiting for a timeout. After a timeout period, it allows test requests (Half-Open state) to see if the service has recovered.

## Key Architectural Decisions

- **Node.js, Express, MySQL**: Fast, lightweight API framework combined with a robust relational database capable of strong transactional guarantees.
- **Repository Pattern**: Abstracts the raw SQL queries into a clean interface (`IUserRepository`), allowing the business logic to be completely decoupled from the data access technology.
- **Unit of Work Pattern**: Wraps database operations in a transactional context (`IUnitOfWork`), ensuring atomicity. If a complex sequence of operations fails midway, the entire transaction is rolled back, preventing partial data updates.
- **Custom Resilience Patterns**: `CircuitBreaker` and `Retry` mechanisms were implemented from scratch to demonstrate a deep understanding of state machines, timeouts, and fallback logic without relying on heavy external libraries.

## Prerequisites

- **Docker** and **Docker Compose** installed on your system.
- No local Node.js or MySQL installation is required as the entire stack is containerized.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd resilient-user-api
   ```

2. **Environment Configuration:**
   Copy the example environment variables file to create a working `.env`:
   ```bash
   cp .env.example .env
   ```
   *(You can modify the `.env` file to tweak the mock service failure rates and circuit breaker thresholds)*

3. **Build and Run:**
   Use Docker Compose to build and start the API, MySQL database, and the Mock Enrichment Service:
   ```bash
   docker-compose up -d --build
   ```

4. **Verify Health:**
   Wait a few seconds for the database to initialize and the services to become healthy.
   ```bash
   docker-compose ps
   ```

## Testing Instructions

You can run the automated test suite directly within the Docker container:

```bash
docker-compose exec app npm test
```

This will run both Unit Tests (testing the Resilience patterns and Business Logic) and Integration Tests (testing the API endpoints with a mocked database layer).

## API Documentation

Detailed OpenAPI 3.0 documentation is available in the `openapi.yaml` file located in the root directory.

### Quick Endpoints Reference

- **POST `/api/users`**: Create a new user.
  - Body: `{"name": "Alice", "email": "alice@example.com"}`
- **GET `/api/users/{id}`**: Retrieve a user by ID.
- **PUT `/api/users/{id}`**: Update a user by ID.
- **DELETE `/api/users/{id}`**: Delete a user by ID.
- **GET `/api/users/{id}/enriched`**: Retrieve a user profile with external enrichment data.
  - *Note: Call this endpoint repeatedly to observe the Mock Service failures, the Retries, and eventually the Circuit Breaker opening.*

## Demonstration of Resilience

To see the Circuit Breaker in action:

1. In `.env`, ensure `MOCK_SERVICE_FAILURE_RATE` is set high (e.g., `0.8` for 80% failure rate).
2. Start the application (`docker-compose up -d`).
3. Make a request to `/api/users/user-1/enriched`.
4. Check the application logs (`docker-compose logs -f app`). You will see Retry attempts. If they fail, the Circuit Breaker's failure count will increment.
5. Once the `CIRCUIT_BREAKER_FAILURE_THRESHOLD` is reached, you will see `[CircuitBreaker] Failure threshold reached. Transitioning to OPEN.` in the logs.
6. Subsequent requests will immediately return a `200 OK` with the basic user profile and `"enrichedDataStatus": "unavailable"` without waiting for the mock service to timeout.
