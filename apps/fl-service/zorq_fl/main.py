from __future__ import annotations

import secrets
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from zorq_fl.backend.client import ZorqBackendClient
from zorq_fl.config import load_settings
from zorq_fl.run.manager import RunManager


class Participant(BaseModel):
    assetId: str = Field(min_length=1, max_length=128)
    partitionId: int = Field(ge=0, le=4)
    ownerWallet: str | None = Field(default=None, max_length=42)


class StartRunRequest(BaseModel):
    runId: str = Field(min_length=1, max_length=64)
    jobId: str = Field(min_length=1, max_length=64)
    totalRounds: int = Field(default=3, ge=3, le=3)
    participants: list[Participant] = Field(min_length=2, max_length=5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = load_settings()
    backend = ZorqBackendClient(
        settings.internal_api_base_url,
        settings.service_token,
        settings.timeout_seconds,
    )
    manager = RunManager(
        backend,
        max_concurrent_runs=settings.max_concurrent_runs,
        max_participants=settings.max_participants,
    )
    app.state.settings = settings
    app.state.manager = manager
    yield
    await manager.shutdown()


app = FastAPI(title="Zorq FL Service", version="0.1.0", lifespan=lifespan)


def require_service_token(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    expected = request.app.state.settings.service_token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    provided = authorization.removeprefix("Bearer ").strip()
    if not secrets.compare_digest(provided, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "zorq-fl-service"}


@app.get("/ready")
async def ready(request: Request) -> dict[str, Any]:
    settings = request.app.state.settings
    return {
        "status": "ready",
        "mode": settings.mode,
        "maxConcurrentRuns": settings.max_concurrent_runs,
        "maxParticipants": settings.max_participants,
    }


@app.post("/runs", status_code=status.HTTP_202_ACCEPTED)
async def start_run(
    body: StartRunRequest,
    request: Request,
    _: Annotated[None, Depends(require_service_token)] = None,
) -> dict[str, Any]:
    manager: RunManager = request.app.state.manager
    try:
        state = await manager.start(
            run_id=body.runId,
            job_id=body.jobId,
            total_rounds=body.totalRounds,
            participants=[participant.model_dump() for participant in body.participants],
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"runId": state.run_id, "status": state.status}


@app.get("/runs/{run_id}")
async def get_run(
    run_id: str,
    request: Request,
    _: Annotated[None, Depends(require_service_token)] = None,
) -> dict[str, Any]:
    manager: RunManager = request.app.state.manager
    state = manager.get(run_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return state.public()
