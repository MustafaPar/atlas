# Atlas

Intelligent last-mile delivery platform with SLA tracking, ETA prediction, and scored courier assignment.

Built with Java 21 · Spring Boot 3.3 · PostgreSQL 16 · React 18 · TypeScript · Vite

---

## Architecture

```
courierflow/
├── atlas-api/          Java backend — REST API, business logic, Flyway migrations
└── atlas-dashboard/    React frontend — operator dashboard
```

The backend runs on port **8080**. The dashboard dev server runs on port **5173** and proxies `/api` requests to the backend — no CORS configuration needed in dev.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Java | 21+ | Required by Spring Boot 3.3 |
| Maven | 3.9+ | Full path on Windows: `C:\ProgramData\chocolatey\lib\maven\...` |
| Docker | any | Used for PostgreSQL only |
| Node.js | 20+ | For the dashboard |
| npm | 9+ | Comes with Node.js |

---

## Quick Start

### 1 — Start PostgreSQL

```bash
docker run --name courierflow-postgres \
  -e POSTGRES_USER=atlas \
  -e POSTGRES_PASSWORD=atlas \
  -e POSTGRES_DB=atlas \
  -p 5432:5432 \
  -d postgres:16
```

If the container already exists from a previous run:

```bash
docker start courierflow-postgres
```

---

### 2 — Generate JWT_SECRET

The backend will not start without this variable.

**PowerShell (Windows):**

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
```

To persist across sessions:

```powershell
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", $env:JWT_SECRET, "User")
```

**bash (macOS / Linux):**

```bash
export JWT_SECRET=$(openssl rand -base64 32)
```

See `atlas-api/.env.example` for all supported environment variables.

---

### 3 — Start the backend

```bash
cd atlas-api
mvn spring-boot:run
```

On first start, Flyway runs migrations **V1–V7** automatically and creates the full schema. The API is ready when you see:

```
Started AtlasApplication in ... seconds
```

Swagger UI is available at: `http://localhost:8080/swagger-ui.html`

---

### 4 — Load demo data

Seed the database with a demo account, two delivery zones, five couriers, and six orders:

Open a new terminal from the repo root, then run:

```bash
docker exec -i courierflow-postgres psql -U atlas -d atlas < scripts/demo-seed.sql
```

Demo login credentials:

| Field | Value |
|---|---|
| Email | `demo@atlas.io` |
| Password | `Atlas2024!` |

Run the seed only once. Re-running it will create duplicate couriers and orders. Only the user and zone inserts are idempotent.

---

### 5 — Start the dashboard

```bash
cd atlas-dashboard
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Backend Reference

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | Yes | — | Base64-encoded 32-byte signing key |
| `DB_USER` | No | `atlas` | PostgreSQL username |
| `DB_PASS` | No | `atlas` | PostgreSQL password |
| `JWT_EXPIRY_MS` | No | `86400000` | Token expiry in milliseconds (24 h) |

### Build

```bash
cd atlas-api
mvn clean package -DskipTests   # produces target/atlas-api-*.jar
mvn clean package               # includes all tests
```

### API documentation

Swagger UI: `http://localhost:8080/swagger-ui.html`

All endpoints return the same envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

### Key endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create operator account |
| `POST` | `/api/v1/auth/login` | Obtain JWT |
| `GET` | `/api/v1/orders` | List orders (filterable) |
| `POST` | `/api/v1/orders` | Create order |
| `POST` | `/api/v1/orders/{id}/assign` | Auto-assign best courier |
| `PATCH` | `/api/v1/assignments/{id}/pickup` | Mark picked up |
| `PATCH` | `/api/v1/assignments/{id}/deliver` | Mark delivered |
| `DELETE` | `/api/v1/assignments/{id}` | Cancel and re-queue |
| `GET` | `/api/v1/orders/{id}/eta` | Get or compute ETA |
| `GET` | `/api/v1/couriers` | List couriers |
| `GET` | `/api/v1/zones` | List delivery zones |

---

## Dashboard Reference

### Development (with hot reload)

```bash
cd atlas-dashboard
npm run dev       # http://localhost:5173
```

### Production build

```bash
npm run build     # outputs to dist/
npm run preview   # serves dist/ at http://localhost:4173
```

In dev mode, Vite proxies `/api` to `http://localhost:8080` server-side — no browser CORS request is made. In preview mode there is no proxy; the browser sends cross-origin requests directly to port 8080, which the backend accepts via its CORS configuration.

---

## Demo Walkthrough

After completing Quick Start, open `http://localhost:5173` and log in with `demo@atlas.io` / `Atlas2024!`.

The Orders page loads six pre-seeded orders. Observe the SLA column immediately:

- **BREACHED** (red) — one URGENT order whose deadline has already passed
- **AT_RISK** (amber) — one URGENT order with 2 minutes left
- **ON_TRACK** (green) — four orders with comfortable remaining time

**Step 1 — Assign a WAITING order**

Click **Assign** on any order with status WAITING. The assignment engine evaluates all five available couriers and selects the highest scorer. An inline card shows the breakdown:

```
Ali Yilmaz  Moto                          83%
ETA      ████████████████████  0.727     35%
SLA      ████████████████████  1.000     35%
Zone     ████████████████████  1.000     20%
Distance █████████████░░░░░░░  0.455     10%
```

**Step 2 — Progress the lifecycle**

- Click **Pickup** → order moves to PICKED_UP
- Click **Deliver** → order moves to DELIVERED, courier returns to AVAILABLE
- Click **Unassign** on an ASSIGNED order to cancel and re-queue it as WAITING

**Step 3 — Assign the same order again**

After unassigning, click Assign again. The partial unique index allows re-assignment because the cancelled assignment is excluded. A different courier may score higher on the second attempt.

---

## Sample API Flow

All requests after registration require `Authorization: Bearer <token>`.

```bash
# 1. Create an operator account
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@example.com","password":"secret123"}' | jq .

# 2. Login (save the token)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@example.com","password":"secret123"}' \
  | jq -r '.data.accessToken')

# 3. Create a delivery zone
curl -s -X POST http://localhost:8080/api/v1/zones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-zone",
    "name": "My Zone",
    "polygon": [
      {"lat":40.970,"lng":29.020},
      {"lat":40.970,"lng":29.060},
      {"lat":41.005,"lng":29.060},
      {"lat":41.005,"lng":29.020}
    ],
    "maxCapacity": 50
  }' | jq .

# 4. Create a courier
COURIER_ID=$(curl -s -X POST http://localhost:8080/api/v1/couriers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Courier","phone":"+90-555-9999","vehicleType":"MOTORCYCLE"}' \
  | jq -r '.data.id')

# Update courier location
curl -s -X PATCH http://localhost:8080/api/v1/couriers/$COURIER_ID/location \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":40.990,"longitude":29.030}' | jq .

# Set courier AVAILABLE
curl -s -X PATCH http://localhost:8080/api/v1/couriers/$COURIER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"AVAILABLE"}' | jq .

# 5. Create an order
ORDER_ID=$(curl -s -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLatitude":40.988,
    "pickupLongitude":29.040,
    "pickupAddress":"Pickup Street 1",
    "deliveryLatitude":41.048,
    "deliveryLongitude":29.010,
    "deliveryAddress":"Delivery Street 2",
    "priority":"HIGH"
  }' | jq -r '.data.id')

# 6. Auto-assign best available courier
ASSIGNMENT=$(curl -s -X POST http://localhost:8080/api/v1/orders/$ORDER_ID/assign \
  -H "Authorization: Bearer $TOKEN")
echo $ASSIGNMENT | jq .

ASSIGNMENT_ID=$(echo $ASSIGNMENT | jq -r '.data.id')

# 7. Mark picked up
curl -s -X PATCH http://localhost:8080/api/v1/assignments/$ASSIGNMENT_ID/pickup \
  -H "Authorization: Bearer $TOKEN" | jq .

# 8. Mark delivered
curl -s -X PATCH http://localhost:8080/api/v1/assignments/$ASSIGNMENT_ID/deliver \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Project Structure

```
courierflow/
├── README.md
├── scripts/
│   └── demo-seed.sql               Demo data: zones, couriers, orders
│
├── atlas-api/                      Spring Boot backend
│   ├── .env.example                Environment variable reference
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/atlas/
│       │   ├── domain/
│       │   │   ├── auth/           JWT authentication
│       │   │   ├── zone/           Delivery zone management
│       │   │   ├── courier/        Courier management
│       │   │   ├── order/          Order lifecycle
│       │   │   ├── sla/            SLA tier evaluation
│       │   │   ├── eta/            ETA prediction engine
│       │   │   └── assignment/     Scored courier assignment
│       │   ├── common/             Shared utilities and config
│       │   └── security/           Spring Security configuration
│       └── resources/
│           ├── application.yml
│           └── db/migration/       Flyway migrations V1-V7
│
└── atlas-dashboard/                React + TypeScript frontend
    ├── src/
    │   ├── api/                    Axios client and TypeScript types
    │   ├── auth/                   Login page and token management
    │   └── orders/                 Orders table, assignment card
    └── vite.config.ts              Proxies /api to localhost:8080
```
