# Automotive Marketplace API

A production-ready RESTful API for an automotive marketplace built with **NestJS**, **MySQL**, and **Kysely**.

## Features

- **Hierarchical Categories:** Recursive CTE queries to fetch categories with arbitrary depth.
- **Dynamic Filters:** Support for category-specific attributes (enum, range, boolean).
- **Faceted & Full-Text Search:** High-performance search with MySQL Full-Text Search and filtering.
- **Keyset Pagination:** Fast cursor-based pagination for listings.
- **Clean Architecture:** Built using NestJS modules and dependency injection.

## Tech Stack

- **Framework:** NestJS
- **Database:** MySQL 8.0
- **Query Builder:** Kysely (Raw SQL & typesafe queries, No ORM used)
- **Validation:** class-validator & zod
- **API Documentation:** Swagger / OpenAPI

## Setup Instructions

### 1. Prerequisites
- Node.js >= 20
- Yarn
- MySQL 8.0 or Docker

### 2. Environment Variables
Copy the `.env.example` file:
```bash
cp .env.example .env
```
Update the `.env` file with your MySQL credentials.

### 3. Start Database (Optional)
If you have Docker installed, you can spin up the MySQL instance:
```bash
docker-compose up -d
```

### 4. Install Dependencies
```bash
yarn install
```

### 5. Run Migrations & Seed Data
Run the migrations to create the database schema:
```bash
yarn db:migrate
```

Seed the database with 500+ realistic listings and category tree (powered by Faker):
```bash
yarn db:seed
```

### 6. Run the Application
```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod
```

## API Documentation

Once the application is running, the Swagger documentation is available at:
**[http://localhost:3000/docs](http://localhost:3000/docs)**

You can find all the request and response examples there.

## Schema Design & Architecture Decisions

- **Categories (`categories` table):** We chose the **Adjacency List** model with a `parent_id` column. To query arbitrary depths efficiently, we use MySQL 8.0+ Recursive CTEs (`WITH RECURSIVE`).
- **Dynamic Attributes:** We used a standard column layout for core entities (`make`, `model`, etc.) and a `dynamic_attributes` JSON column in the `listings` table for any extra category-specific attributes (like `doors` for cars, `engine_type` for motorcycles).
- **Category Filters (`category_filters` table):** This table acts as a registry to inform the frontend which filters (and options) are available for each category.
- **Search:** We implemented MySQL's `FULLTEXT` indexing on `make`, `model`, and `location` for fast text search (`MATCH AGAINST`). We combined this with B-Tree indexes for faceted filtering on price, year, and category ID.
- **Pagination:** For `GET /listings`, we used cursor-based (keyset) pagination on `(created_at, id)` to prevent slow `OFFSET` queries on large datasets.

## Deployment

The application includes a `Dockerfile` optimized for production and can be deployed directly to services like Railway, Render, or Fly.io.

**Live Base URL:** `automotive-marketplace-production.up.railway.app`
