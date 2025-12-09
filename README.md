# NepBio Batch Records Management System

Full-stack platform for digitizing batch records for NepBio pharmaceuticals. React, Express, Prisma, and PostgreSQL integrated with Auth0.

## Overview

NepBio Batch Records pharmaceutical batch templates, production entries, approvals, and audit logs. role-scoped UX serves operators, supervisors, QA/QC, and administrators, while the backend
preserves an immutable and versioned edit history.

## Team Members

Soorya Narayanan Sanand 25254386
Rakshita Surisetti Venkata 24465977
Lila Lansang 25307861
Jungbyn Choi 14209009
Felix Lush 24546931
Mohammad Rafae Rajani 25702085

## Core Capabilities

- Batch management: instantiate records from approved templates, track status transitions, capture production/QC data, export for review.
- Template builder: construct hierarchical sections, validation rules, and version history to control modifications.
- Approvals and electronic signatures: route change requests, log reviewer comments, capture IP/user-agent metadata for signatures.
- Audit logging: persist every significant action, signature, and status change for regulatory traceability.
- Master data administration: manage products, formulations, and Auth0-synchronized user accounts with activation controls.

## UI/UX Design

- Figma: https://www.figma.com/design/7uvgXpIuN2nKwLOnK9NWdD/Myna-UI---TailwindCSS---shadcn-ui---Radix-Premium-UI-Kit--Community-?node-id=4606-2381&p=f

## Tech Stack

- Frontend: React 19, TypeScript, Vite 7, Tailwind CSS 4, ShadCn
- Backend: Node 20+, Express 5, Prisma 6, tsx, Auth0 JWT middleware.
- Database: PostgreSQL 15 with Prisma migrations and seed scripts.
- Tooling: ESLint, Prettier, Docker, Docker Compose.

## Repository

Github: https://github.com/NepBio-Project/NepBioBatchRecords

NepBioBatchRecords/  
docker-compose.yml  
 client/  
 ├── src/components/…  
 ├── src/auth/  
 └── Dockerfile  
 server/  
 ├── controllers/  
 ├── routes/  
 ├── services/  
 ├── prisma/  
 └── Dockerfile  

## Prerequisites

- Node.js v20+ and npm.
- Docker and Docker Compose.
- PostgreSQL 15.
- Auth0 tenant with SPA and Management API credentials.

## Local Development

1. Clone and install dependencies:

   ```bash
   git clone https://github.com/NepBio-Project/NepBioBatchRecords.git
   cd NepBioBatchRecords
   npm install

   ```

2. Create server/.env and client/.env (see Environment Configuration).
3. Start PostgreSQL locally or run docker-compose up postgres -d.
4. Generate Prisma client and apply migrations:

   npm run db:generate
   npm run db:migrate

5. Optional seed:

   cd server
   npx prisma db seed
   cd ..

6. Launch dev stack:

   npm run dev
   - Client: <http://localhost:5173>
   - API: <http://localhost:3001>

## Environment Configuration

server/.env

PORT=3001  
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nepbio_batch_records  
AUTH0_DOMAIN=<https://your-tenant.region.auth0.com>  
AUTH0_AUDIENCE=<https://nepbio-api>  
AUTH0_MGMT_DOMAIN=<https://your-tenant.region.auth0.com>  
AUTH0_MGMT_CLIENT_ID=...  
AUTH0_MGMT_CLIENT_SECRET=...  
AUTH0_MGMT_AUDIENCE=<https://your-tenant.region.auth0.com/api/v2/>  
AUTH0_FRONT_CLIENT_ID=...  
BASEURL=<https://app.example.com>  
ENABLE_SIGNATURE_REAUTH=true  
SIGNATURE_MAX_AGE_SECONDS=300  
AUTH0_ROLE_ADMIN_ID=...  
AUTH0_ROLE_QA_ID=...  
AUTH0_ROLE_OPERATOR_ID=...  

# If you add new roles to the auth0 setup you need to add their role ID to the env variable

client/.env  

VITE_API_SERVER_URL=<http://localhost:3001>  
VITE_SERVER_URL=<http://localhost:3001>  
VITE_AUTH0_DOMAIN=your-tenant.region.auth0.com  
VITE_AUTH0_CLIENT_ID=...  
VITE_AUTH0_AUDIENCE=<https://nepbio-api>  

Refer to DEPLOY_DEV_GUIDE.md for greater details

## Database and Prisma

- Schema lives in server/prisma/schema.prisma with enums for roles, product categories, batch statuses, approval rules, section types, and quality checks.
- Key commands:

  npm run db:generate # Prisma client  
  npm run db:migrate # Apply migrations  
  npm run db:reset # Drop and recreate DB (destructive)  
  npm run db:studio # Launch Prisma Studio  

- server/prisma/seed.ts inserts sample templates and batch definitions.

## npm Scripts

- npm run dev: Concurrent client and server.  
- npm run build: Production client bundle.
- npm run start: Server in production mode (runs workspace script).
- npm run test: Executes client and server test scripts (server test currently placeholder).
- npm run lint: Lint client workspace.
- npm run install:all: Install dependencies for root, client, and server.
- npm run env:reset:mac / npm run env:reset:win: Remove node_modules and lockfiles for a clean install.
- npm run dev -w client, npm run build -w client, npm run lint -w client: Client-specific workflows.
- npm run dev -w server, npm run start -w server: Server execution scripts.
- npm run db:\* -w server: Prisma utilities (generate, migrate, studio, reset).

## Docker and Deployment

Use docker-compose.yml to run PostgreSQL, the API, and the client:

docker-compose up --build # Build and run full stack
docker-compose up postgres -d # Database only
docker-compose logs -f server # Stream API logs
docker-compose down # Stop stack

- Server container executes npx prisma migrate deploy before npm start.
- Client container serves the production bundle on port 3003.
- Provide production-ready .env files within client and server.

For production deployments, front services with a reverse proxy, host PostgreSQL via a managed provider, and store secrets in a secure vault or CI/CD pipeline.
"# UTS-batch-record" 
