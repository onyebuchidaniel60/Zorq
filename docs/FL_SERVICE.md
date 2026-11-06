# Zorq FL Service

Python 3.12 FastAPI + Flower + PyTorch CPU demonstration coordinator. It runs the fixed `synthetic-binary-classifier-v1` task and requests a fresh on-chain authorization snapshot from the Next.js backend before every round.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | None | Liveness |
| `GET` | `/ready` | None | Configuration and mode readiness |
| `POST` | `/runs` | `Authorization: Bearer <FL_SERVICE_SHARED_SECRET>` | Start one three-round simulation |
| `GET` | `/runs/{runId}` | Bearer | In-memory run status |

`POST /runs` accepts `{runId, jobId, totalRounds: 3, participants: [{assetId, partitionId, ownerWallet}]}`. It returns `202` immediately and runs the simulation in the background.

## Authorization rule

Before each round the service calls:

`POST {ZORQ_INTERNAL_API_BASE_URL}/api/internal/runs/{runId}/authorization-snapshot`

The backend reads every candidate license from `ZorqRegistry` at one confirmed block. Only entries in `allowed` are instantiated as Flower clients. `AuthorizationFedAvg.aggregate_fit` filters again by the same CID allowlist before Flower's FedAvg aggregation. Fewer than two allowed clients, an RPC error, or a missing snapshot fails the run; stale or cached authorization is never used.

## Environment

- `FL_SERVICE_SHARED_SECRET` — high-entropy service token.
- `ZORQ_INTERNAL_API_BASE_URL` — stable Next.js preview origin.
- `FL_SERVICE_MODE=simulation`.
- `FLOWER_MAX_CONCURRENT_RUNS=1`.
- `FLOWER_MAX_PARTICIPANTS=5`.
- `DEMO_DATA_SEED=20261104`.
- `PYTHONUNBUFFERED=1`.

## Local run

```bash
cd apps/fl-service
uv sync
FL_SERVICE_SHARED_SECRET=... ZORQ_INTERNAL_API_BASE_URL=http://localhost:3100 \
  uv run uvicorn zorq_fl.main:app --host 127.0.0.1 --port 8000
```

Tests:

```bash
cd apps/fl-service
uv run pytest -q
```

The tests cover three-round completion with two authorized clients, fail-closed behaviour with fewer than two, deterministic model hashing, and the FedAvg allowlist filter.

## Render

- Service: `zorq-fl-service` (`srv-dbmbfht9fdbs73ccvj5g`)
- URL: `https://zorq-fl-service.onrender.com`
- Dockerfile: `apps/fl-service/Dockerfile`; root directory `apps/fl-service`
- Plan: free; region: Oregon; health check: `/health`
- CPU-only PyTorch (`torch==2.9.1+cpu`) to fit the free build/runtime footprint.


## External database participants

An authorized external asset carries `dataSource: "external"`, an encrypted-at-rest database URL, a table name and a label column in the internal snapshot. The coordinator uses SQLAlchemy with psycopg and pandas to read up to 1,000 rows, select up to eight numeric features, normalize a binary label and build train/evaluation tensors. If the connection or normalization fails, that participant is marked as a data failure and skipped; the run continues only if at least two participants load successfully. Raw rows are not persisted.
