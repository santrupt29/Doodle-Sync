<div align="center">

# 🎨 Doodle-Sync

**A real-time multiplayer drawing & guessing game built with microservices**

Java 21 · Spring Boot 3.5 · React 19 · Kafka · Redis · WebSocket

[Architecture](#architecture) · [How It Works](#how-it-works) · [Quick Start](#quick-start) · [Observability](#observability) · [Load Testing](#load-testing)

▶️ [**Watch Demo Video**](https://drive.google.com/file/d/1T3MsEo3LxXi6Gzky-4QpUbwg6AkAsaOq/view)

</div>

---

## Architecture

<img src="docs/architecture.png" alt="System Architecture" />

<details>
<summary><strong>View detailed architecture →</strong></summary>
<br/>
<img src="docs/architecture-detailed.png" alt="Detailed Architecture" />
</details>

### Services at a Glance

| Service | Port | Responsibility | Data Store |
|---------|------|---------------|------------|
| **API Gateway** | 8765 | JWT auth, rate limiting (100 req/min), CORS, routing | Redis (tokens) |
| **User Service** | 8084 | Registration, login, JWT signing, WS ticket issuance | PostgreSQL, Redis |
| **Game Service** | 8082 | State machine (WAITING → CHOOSING → DRAWING → RESULTS → GAME_OVER), round timer | MongoDB, Redis |
| **Drawing Service** | 8081 | Stroke ingestion via WebSocket, canvas replay, Redis Pub/Sub fan-out | Redis |
| **Chat Service** | 8080 | Guess validation (Levenshtein distance), "close guess" detection | Redis, Kafka |
| **Word Service** | 8085 | Word bank, progressive hints every 15s | PostgreSQL, Kafka |
| **Score Service** | 8083 | Time-decay scoring (100 pts − 1/sec), Redis sorted set leaderboard | PostgreSQL, Redis |
| **Discovery Server** | 8761 | Eureka service registry | — |

---

## Tech Stack

**Backend** — Java 21, Spring Boot 3.5, Spring Cloud Gateway, Eureka, OpenFeign, Resilience4j, Kafka (KRaft), Redis 7, MongoDB 7, PostgreSQL 16

**Frontend** — React 19, Vite 8, @stomp/stompjs, React Router 7, Tailwind CSS 4

**Infrastructure** — Docker, Docker Compose, Prometheus, Grafana, Zipkin, k6

---

## How It Works

### Drawing Pipeline — Drawer to Guessers in <0.2ms

```
Drawer's browser
  │ WebSocket (STOMP + ticket auth)
  ▼
Drawing Service ─── /app/room.{code}.stroke
  │
  ├─→ Redis LIST (RPUSH canvas:{code})   ← stroke persisted for late-join replay
  │
  └─→ Redis Pub/Sub (draw:{code})        ← fire-and-forget fan-out
        │
        ▼
  StrokeBroadcastListener (pattern: draw:*)
        │
        └─→ /topic/room.{code}.canvas    ← broadcast to all subscribed guessers
```

> **Why Redis Pub/Sub instead of Kafka for strokes?** Strokes are ephemeral — already persisted in Redis lists for replay. Kafka's durability (disk writes, consumer groups, offset tracking) is redundant overhead. Redis Pub/Sub delivers in-memory with sub-millisecond latency, perfectly matching the fire-and-forget nature of real-time drawing data. Kafka is still used for durable events (`game-events`, `chat-events`) where at-least-once delivery matters.

### Guess Validation Flow

```
Guesser types a word
  │ WebSocket (STOMP)
  ▼
Chat Service ─── /app/room.{code}.guess
  │
  ├─ Reads answer from Redis (word:{code})
  ├─ Checks if player already guessed (correct:{code}:{userId})
  │
  ├─ CORRECT  → broadcast "🎉 Player guessed it!" + publish to Kafka (chat-events)
  ├─ CLOSE    → broadcast "so close!" (Levenshtein distance ≤ 1)
  └─ WRONG    → broadcast as regular chat message
```

Score Service consumes `chat-events` → awards **100 − (seconds elapsed × 1)** points (minimum 10) → stores in a Redis sorted set for instant leaderboard queries.

### Progressive Hints

Word Service runs a `ScheduledExecutorService` that reveals one letter every 15 seconds via `game-events` Kafka topic. Characters are revealed in random order:

```
 _ _ _ _ _ _ _     (0s)
 _ _ _ P _ _ _     (15s)
 _ _ _ P _ A _     (30s)
 _ L _ P _ A _     (45s)
```

### Resilience — Circuit Breaker on Word Fetch

Game Service fetches words via **OpenFeign → Word Service** wrapped with Resilience4j:

```
@CircuitBreaker → @TimeLimiter (2s) → @Retry (3 attempts)
```

If Word Service goes down, the circuit opens after 5 failures and a **fallback word pool** kicks in — the game continues uninterrupted. When Word Service recovers, the circuit moves to half-open, tests 3 calls, and closes.

### Event Channels

| Channel | Type | Producer → Consumer(s) | Purpose |
|---------|------|------------------------|---------|
| `game-events` | Kafka | Game Service → Chat, Drawing, Score, Word | Durable state transitions: ROUND_STARTED, DRAWING_STARTED, ROUND_ENDED, GAME_OVER, HINT |
| `chat-events` | Kafka | Chat Service → Score Service | Durable correct guess events with elapsed time for scoring |
| `draw:{roomCode}` | Redis Pub/Sub | Drawing Service → Drawing Service | Ephemeral stroke fan-out (sub-ms latency, fire-and-forget) |

### WebSocket Authentication

Browsers cannot send `Authorization` headers during WebSocket upgrade. Instead of whitelisting WS endpoints, we use **ticket-based auth**:

```
1. Client → POST /user/auth/ws-ticket (JWT required, validated by gateway)
2. user-service generates UUID ticket → Redis (ws-ticket:{uuid}, TTL 30s)
3. Client → ws://host/ws/websocket?ticket={uuid}
4. Drawing/Chat service HandshakeInterceptor validates + deletes ticket
5. Connection established with authenticated userId in session
```

Tickets are one-time-use and expire in 30 seconds — a compromised ticket cannot be replayed.

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend dev server)

### Run with Docker Compose

```bash
git clone https://github.com/santrupt29/Doodle-Sync.git
cd Doodle-Sync
docker compose up --build
```

> First build takes 5-8 minutes (Maven downloads + Docker image builds).
> Services start in dependency order via healthcheck chains.

**After all services are healthy:**

```bash
cd client
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:8765 |
| Eureka Dashboard | http://localhost:8761 |
| Grafana | http://localhost:3001 (admin / scribble) |
| Zipkin | http://localhost:9411 |
| Prometheus | http://localhost:9090 |

### Environment Variables

Create a `.env` file in the project root (a default is included):

```env
DB_PASSWORD=password
JWT_SECRET=dev-secret-key-change-in-production-256bit
```

---

## Observability

All 7 services export traces to **Zipkin** and metrics to **Prometheus** (scraped every 15s from `/actuator/prometheus`). Grafana ships with a pre-provisioned dashboard.

### Distributed Tracing — Zipkin

A single user action (e.g., creating a room) generates a trace that spans across API Gateway → Game Service → Word Service, showing the full request lifecycle:

<img src="docs/zipkin-trace.jpeg" alt="Zipkin distributed trace across services" />

### Grafana Dashboard

The provisioned dashboard includes:
- **Request rate** per service (req/s)
- **P99 latency** (histogram quantile)
- **5xx error rate** per service
- **JVM heap usage** per service
- **Circuit breaker state** for word-service

<img src="docs/grafana-1.jpeg" alt="Grafana — Request rate and P99 latency" />
<img src="docs/grafana-2.jpeg" alt="Grafana - JVM heap and error rates" />
<img src="docs/grafana-3.png" alt="Grafana — Circuit breaker state" />

---

## Load Testing

WebSocket stroke throughput tested with [k6](https://k6.io/):

**Scenario:** 8 concurrent WebSocket connections, 10 strokes/sec per VU, 60 seconds sustained

```
  █ THRESHOLDS

    stroke_latency_ms
    ✓ 'p(99) < 200'         p(99) = 1ms

    ws_connect_errors
    ✓ 'count < 3'           count = 0

  █ TOTAL RESULTS

    strokes_sent............: 7,190    ~80/s
    stroke_latency_ms.......: avg=0.2ms   p(90)=1ms    p(99)=1ms
    ws_connecting...........: avg=25ms    p(90)=33ms
    ws_msgs_received........: 57,424   ~630/s
    ws_sessions.............: 16        (8 VUs × 2 connections)
    iterations..............: 8         complete, 0 interrupted
    checks_succeeded........: 100%      ✓ WS connected
```

Run it yourself:

```bash
k6 run load-tests/stroke-load-test.js 2>&1 | tee docs/k6-results.txt
```

---

## Project Structure

```
Doodle-Sync/
├── api-gateway/             Spring Cloud Gateway + JWT filter + rate limiter
├── discovery-server/        Eureka service registry
├── user-service/            Auth (register/login) + JWT + WS tickets + PostgreSQL + Redis
├── game-service/            Game state machine + round timer + MongoDB
├── drawing-service/         WebSocket strokes + Redis Pub/Sub fan-out + ticket auth
├── chat-service/            WebSocket guesses + Levenshtein validator + ticket auth
├── word-service/            Word bank + progressive hints
├── score-service/           Time-decay scoring + Redis leaderboard
├── client/                  React 19 + Vite + STOMP WebSocket
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/provisioning/
│       ├── datasources/     Prometheus datasource (auto-provisioned)
│       └── dashboards/      Dashboard JSON + provisioner
├── load-tests/              k6 WebSocket stroke load test
├── postgres-init/           init.sql (3 databases, roles, grants)
├── docs/                    Architecture diagrams, screenshots, results
└── docker-compose.yml       15 containers, healthcheck chains
```

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **Ticket-based WS auth** | Browsers can't send JWT headers during WebSocket upgrade — a one-time Redis ticket (30s TTL) acts as a short-lived proxy for the JWT, consumed on first handshake |
| **Redis Pub/Sub** for strokes (not Kafka) | Strokes are ephemeral and already persisted in Redis lists. Kafka's disk persistence, consumer groups, and offset tracking add latency and complexity with zero benefit for fire-and-forget data |
| **Kafka** for game/chat events | State transitions (`ROUND_STARTED`, `GAME_OVER`) and scoring events (`CORRECT_GUESS`) need at-least-once delivery guarantees — Kafka's durability is essential here |
| **Redis for ephemeral state** | Canvas strokes, current word, guess dedup, WS tickets, leaderboard — all expire with TTL, no schema needed |
| **MongoDB for game sessions** | Flexible schema for dynamic player lists, nested state, and room config |
| **PostgreSQL for structured data** | Users, words, scores — relational integrity with Flyway migrations |
| **Levenshtein distance for "close" guesses** | Single-letter typos ("elefant" → "elephant") shouldn't be punished in a fast-paced game |
| **Time-decay scoring** | Faster guesses earn more points (100 − seconds elapsed), with a floor of 10 |
| **Fallback word pool** | If word-service is down, the game picks from a hardcoded pool — never blocks |

