# Atlas

An intelligent last-mile delivery backend built with Java, Spring Boot, PostgreSQL, and React.

Atlas simulates how modern delivery platforms assign couriers, predict delivery times, track SLA compliance, and manage delivery operations across geographic zones.

---

## Features

### Authentication
- JWT-based authentication
- Secure password storage with BCrypt
- Protected REST API endpoints

### Delivery Zones
- Polygon-based delivery zones
- Coordinate-to-zone resolution
- Zone capacity management

### Courier Management
- Courier registration and status tracking
- Vehicle type support (Bike, Motorcycle, Car)
- Live location updates
- Zone assignment

### Order Management
- Order creation and lifecycle tracking
- Automatic zone resolution
- Priority-based processing
- Delivery status workflow

### SLA Tracking
- Automatic SLA assignment
- ON_TRACK, AT_RISK, and BREACHED states
- Deadline monitoring

### ETA Prediction
- Distance-based ETA calculation
- Vehicle-aware speed estimation
- Confidence scoring
- SLA feasibility analysis

### Assignment Engine
- Automatic courier selection
- Multi-factor scoring model
- ETA, SLA, zone, and distance optimization
- Assignment explainability

### Demo Dashboard
- React-based operations dashboard
- Order monitoring
- Assignment workflow
- SLA visibility

---

## Technology Stack

**Backend:**
- Java 21
- Spring Boot 3
- Spring Security
- PostgreSQL
- Flyway
- Hibernate / JPA

**Frontend:**
- React
- TypeScript
- Vite
- Axios
- Tailwind CSS

---

## Architecture

Atlas follows a layered architecture:

```
Client → REST API → Services → Repositories → PostgreSQL
```

Core business modules:
- Auth
- Zones
- Couriers
- Orders
- SLA
- ETA
- Assignments

---

## Quick Start

### Start PostgreSQL

```bash
docker run --name courierflow-postgres \
  -e POSTGRES_DB=atlas \
  -e POSTGRES_USER=atlas \
  -e POSTGRES_PASSWORD=atlas \
  -p 5432:5432 \
  -d postgres:16
```

### Start Backend

```bash
cd atlas-api
mvn spring-boot:run
```

The backend requires a `JWT_SECRET` environment variable — a Base64-encoded 32-byte key.

**PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
```

**bash:**
```bash
export JWT_SECRET=$(openssl rand -base64 32)
```

See `atlas-api/.env.example` for all supported environment variables.

### Load Demo Data

```bash
# Open a new terminal from the repo root, then run:
docker exec -i courierflow-postgres psql -U atlas -d atlas < scripts/demo-seed.sql
```

Demo account:

| Field | Value |
|---|---|
| Email | `demo@atlas.io` |
| Password | `Atlas2024!` |

### Start Dashboard

```bash
cd atlas-dashboard
npm install
npm run dev
```

Open: `http://localhost:5173`

---

## Roadmap

- Interactive map visualization
- Real-time courier tracking
- Analytics dashboard
- WebSocket updates
- Deployment automation

---

## License

MIT
