from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    service_token: str
    internal_api_base_url: str
    mode: str
    max_concurrent_runs: int
    max_participants: int
    data_seed: int
    timeout_seconds: float


def load_settings() -> Settings:
    token = os.environ.get("FL_SERVICE_SHARED_SECRET", "")
    backend = os.environ.get("ZORQ_INTERNAL_API_BASE_URL", "")
    mode = os.environ.get("FL_SERVICE_MODE", "simulation")
    if not token or len(token) < 32:
        raise RuntimeError("FL_SERVICE_SHARED_SECRET must be set to a high-entropy value")
    if not backend:
        raise RuntimeError("ZORQ_INTERNAL_API_BASE_URL must be set")
    if mode != "simulation":
        raise RuntimeError("FL_SERVICE_MODE must be 'simulation' for this MVP")
    return Settings(
        service_token=token,
        internal_api_base_url=backend.rstrip("/"),
        mode=mode,
        max_concurrent_runs=int(os.environ.get("FLOWER_MAX_CONCURRENT_RUNS", "1")),
        max_participants=int(os.environ.get("FLOWER_MAX_PARTICIPANTS", "5")),
        data_seed=int(os.environ.get("DEMO_DATA_SEED", "20261104")),
        timeout_seconds=float(os.environ.get("FL_SERVICE_TIMEOUT_MS", "15000")) / 1000.0,
    )
