from __future__ import annotations

import pytest

from zorq_fl.run.manager import RunState, run_simulation


class FakeBackend:
    def __init__(self, allowed_per_round: list[list[dict]] | None = None) -> None:
        self.allowed_per_round = allowed_per_round
        self.events: list[dict] = []
        self.completed: dict | None = None
        self.failed: dict | None = None
        self.round = 0

    async def authorization_snapshot(self, run_id: str, round_number: int):
        self.round = round_number
        allowed = (
            self.allowed_per_round[round_number - 1]
            if self.allowed_per_round
            else [
                {"assetId": "asset-a", "partitionId": 0},
                {"assetId": "asset-b", "partitionId": 1},
            ]
        )
        return {
            "runId": run_id,
            "roundNumber": round_number,
            "snapshot": {"blockNumber": 10 + round_number, "blockHash": "0x" + "11" * 32},
            "allowed": allowed,
            "denied": [],
        }

    async def event(self, run_id: str, payload: dict):
        self.events.append(payload)
        return {"ok": True}

    async def complete(self, run_id: str, final_model_hash: str, metrics: dict):
        self.completed = {"hash": final_model_hash, "metrics": metrics}
        return {"ok": True}

    async def fail(self, run_id: str, failure_code: str, public_message: str):
        self.failed = {"code": failure_code, "message": public_message}
        return {"ok": True}


@pytest.mark.asyncio
async def test_three_rounds_with_two_authorized_clients() -> None:
    backend = FakeBackend()
    state = RunState(
        run_id="run-1",
        job_id="job-1",
        total_rounds=3,
        participants=[{"assetId": "asset-a", "partitionId": 0}, {"assetId": "asset-b", "partitionId": 1}],
    )
    await run_simulation(state, backend, data_seed=20261104)
    assert state.status == "completed"
    assert len(backend.events) == 3
    assert backend.completed is not None
    assert backend.completed["hash"].startswith("0x")
    assert len(backend.completed["hash"]) == 66
    assert state.final_model_hash == backend.completed["hash"]


@pytest.mark.asyncio
async def test_fails_closed_when_fewer_than_two_authorized() -> None:
    backend = FakeBackend(allowed_per_round=[[{"assetId": "asset-a", "partitionId": 0}]])
    state = RunState(
        run_id="run-2",
        job_id="job-2",
        total_rounds=3,
        participants=[{"assetId": "asset-a", "partitionId": 0}],
    )
    await run_simulation(state, backend, data_seed=20261104)
    assert state.status == "failed"
    assert state.failure_code == "INSUFFICIENT_AUTHORIZED_PARTICIPANTS"
    assert backend.failed is not None


@pytest.mark.asyncio
async def test_model_hash_is_deterministic_for_same_seed() -> None:
    async def run() -> str:
        backend = FakeBackend()
        state = RunState(
            run_id="run-3",
            job_id="job-3",
            total_rounds=3,
            participants=[{"assetId": "asset-a", "partitionId": 0}, {"assetId": "asset-b", "partitionId": 1}],
        )
        await run_simulation(state, backend, data_seed=20261104)
        assert backend.completed is not None
        return backend.completed["hash"]

    assert await run() == await run()
