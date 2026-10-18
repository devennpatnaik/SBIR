# Self-host (Docker Compose)

Bourne-free stack: Postgres + PostgREST + Hono API + nginx/Vite UI.

```bash
cp .env.example .env
docker compose up --build
```

App: **http://localhost:8080**

| Service | Default port |
|---------|----------------|
| Web UI | `8080` |
| API | `8787` |
| PostgREST | `3001` |
| Postgres | `5432` |

First boot applies `prisma/migrations` (including Layer 4). Create an account on the sign-in screen (`AUTH_MODE=local` HS256 JWT shared with PostgREST via `JWT_SECRET`).

Assistant / Eve features are stubbed until a separate runtime is wired.

## Notes

- Inter-service URLs use `host.docker.internal` + published ports (Linux Compose adds `extra_hosts: host-gateway`).
- Change `JWT_SECRET` before any shared or production use.
- Wipe the DB volume to re-run migrations: `docker compose down -v`.
