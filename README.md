<p align="center">
  <img src="docs/Atlas-banner.png" alt="Atlas Banner" width="100%">
</p>

<h1 align="center">ATLAS</h1>

<p align="center">
  <strong>Intelligent Last-Mile Delivery Platform</strong>
  <br/>
  Real-time courier tracking, road-based routing and delivery operations dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-green">
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue">
  <img src="https://img.shields.io/badge/React-19-61DAFB">
  <img src="https://img.shields.io/badge/TypeScript-5-blue">
  <img src="https://img.shields.io/badge/Docker-2496ED">
  <img src="https://img.shields.io/badge/Status-Active-success">
</p>

<p align="center">
  A full-stack logistics platform for simulating and managing last-mile delivery operations.
</p>

---

# Demo

<p align="center">
  <img src="docs/Atlas.gif" width="100%">
</p>

---

## Features

- Real-time courier tracking
- Road-based routing powered by OSRM
- Order assignment and delivery workflow
- Pickup and delivery confirmations
- Delivery zone management
- SLA monitoring and ETA tracking
- Multi-courier simulation
- Demo reset functionality
- JWT authentication
- Dockerized PostgreSQL environment

---

## Screenshots

## Login

<p align="center">
  <img src="docs/atlas-login.png" width="80%">
</p>

---

## Operations Dashboard

<p align="center">
  <img src="docs/atlas-dashboard.png" width="100%">
</p>

---

## Interactive Map

<p align="center">
  <img src="docs/atlas-map.png" width="100%">
</p>

---

## Real-Time Multi-Courier Simulation

<p align="center">
  <img src="docs/atlas-simulated.png" width="100%">
</p>

---

## Architecture

```text
React + TypeScript Dashboard
            │
            ▼
Spring Boot REST API
            │
            ▼
PostgreSQL Database
            │
            ▼
Docker
```

---

## Tech Stack

## Backend

- Java 21
- Spring Boot 3
- Spring Security
- JWT Authentication
- JPA / Hibernate
- Flyway
- PostgreSQL
- Docker

## Frontend

- React
- TypeScript
- Vite
- Leaflet
- Axios

---

## Getting Started

## Prerequisites

Before running Atlas locally, make sure you have:

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker Desktop

---

## Clone Repository

```bash
git clone https://github.com/MustafaPar/atlas.git
cd atlas
```

---

## Start PostgreSQL

```bash
docker run --name atlas-postgres \
-e POSTGRES_DB=atlas \
-e POSTGRES_USER=atlas \
-e POSTGRES_PASSWORD=atlas \
-p 5432:5432 \
-d postgres:16
```

Verify that PostgreSQL is running:

```bash
docker ps
```

---

## Start Backend

Open a terminal in the project root:

```bash
cd atlas-api
```

Set the JWT secret and start the API.

### Windows PowerShell

```powershell
$env:JWT_SECRET="atlas-demo-secret-key-at-least-32-characters"
mvn spring-boot:run
```

### Linux / macOS

```bash
export JWT_SECRET="atlas-demo-secret-key-at-least-32-characters"
mvn spring-boot:run
```

The API will be available at:

```text
http://localhost:8080
```

---

## Start Frontend

Open a second terminal in the project root:

```bash
cd atlas-dashboard
npm install
npm run dev
```

The dashboard will be available at:

```text
http://localhost:5173
```

> Vite may use another port if 5173 is already occupied. Check the terminal output for the exact local URL.

---

## Demo Account

```text
Email:    demo@atlas.io
Password: demo12345
```

---

## Reset Demo Data

After logging in, use the **Reset Demo** button to restore demo orders and couriers to their initial state.

---

## Project Structure

```text
atlas-api/
├── auth/
├── courier/
├── delivery-zone/
├── order/
├── assignment/
├── simulation/
└── common/

atlas-dashboard/
├── auth/
├── api/
├── map/
├── orders/
└── components/
```

---

## Roadmap

- [ ] WebSocket live updates
- [ ] Route optimization engine
- [ ] Notification system
- [ ] Analytics dashboard
- [ ] Mobile courier application
- [ ] Kubernetes deployment

---

## Author

**Mustafa Par**

Computer Engineering Student @ Istinye University

GitHub: https://github.com/MustafaPar

---

<p align="center">
Built with Java, Spring Boot and a passion for logistics.
</p>
