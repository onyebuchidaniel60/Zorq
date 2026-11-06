from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from zorq_fl.model.external import ExternalDataError, load_external_partition
from zorq_fl.run.manager import RunState, run_simulation


def _create_sqlite(path: Path) -> str:
    connection = sqlite3.connect(path)
    try:
        connection.execute(
            """
            create table training_rows (
                f1 real, f2 real, f3 real, f4 real,
                f5 real, f6 real, f7 real, f8 real,
                label integer
            )
            """
        )
        rows = []
        for index in range(120):
            values = [float((index + offset) % 7) / 7 for offset in range(8)]
            rows.append((*values, 1 if sum(values) >= 3.5 else 0))
        connection.executemany(
            "insert into training_rows values (?,?,?,?,?,?,?,?,?)",
            rows,
        )
        connection.commit()
    finally:
        connection.close()
    return f"sqlite:///{path}"


class FakeBackend:
    def __init__(self, allowed_per_round: list[list[dict]]) -> None:
        self.allowed_per_round = allowed_per_round
        self.events: list[dict] = []
        self.completed: dict | None = None
        self.failed: dict | None = None

    async def authorization_snapshot(self, run_id: str, round_number: int):
        return {
            "runId": run_id,
            "roundNumber": round_number,
            "snapshot": {"blockNumber": 20 + round_number, "blockHash": "0x" + "22" * 32},
            "allowed": self.allowed_per_round[round_number - 1],
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


def test_external_partition_normalises_to_eight_features(tmp_path: Path) -> None:
    db_url = _create_sqlite(tmp_path / "external.sqlite")
    partition = load_external_partition(db_url, "training_rows", "label", 123)

    assert partition.row_count == 120
    assert len(partition.train) > 0
    assert len(partition.evaluation) > 0
    features, labels = partition.train[0]
    assert tuple(features.shape) == (8,)
    assert float(labels) in (0.0, 1.0)


def test_external_partition_rejects_missing_label(tmp_path: Path) -> None:
    db_url = _create_sqlite(tmp_path / "external.sqlite")
    with pytest.raises(ExternalDataError, match="not found"):
        load_external_partition(db_url, "training_rows", "missing", 123)


@pytest.mark.asyncio
async def test_external_failure_does_not_crash_remaining_participants(tmp_path: Path) -> None:
    db_url = _create_sqlite(tmp_path / "external.sqlite")
    allowed = [
        {
            "assetId": "external-a",
            "partitionId": None,
            "dataSource": "external",
            "dbUrl": db_url,
            "dbTable": "training_rows",
            "labelColumn": "label",
        },
        {"assetId": "asset-b", "partitionId": 0, "dataSource": "demo"},
        {"assetId": "asset-c", "partitionId": 1, "dataSource": "demo"},
    ]
    backend = FakeBackend([allowed, allowed, allowed])
    state = RunState(
        run_id="run-external",
        job_id="job-external",
        total_rounds=3,
        participants=allowed,
    )

    await run_simulation(state, backend, data_seed=20261104)

    assert state.status == "completed"
    assert backend.completed is not None
    assert len(backend.events) == 3
    assert all(event["aggregatedCount"] == 3 for event in backend.events)


@pytest.mark.asyncio
async def test_unusable_external_source_fails_closed_with_clear_code() -> None:
    allowed = [
        {
            "assetId": "external-a",
            "partitionId": None,
            "dataSource": "external",
            "dbUrl": "postgresql://user:pass@127.0.0.1:1/none",
            "dbTable": "training_rows",
            "labelColumn": "label",
        },
        {"assetId": "asset-b", "partitionId": 0, "dataSource": "demo"},
    ]
    backend = FakeBackend([allowed, allowed, allowed])
    state = RunState(
        run_id="run-external-fail",
        job_id="job-external-fail",
        total_rounds=3,
        participants=allowed,
    )

    await run_simulation(state, backend, data_seed=20261104)

    assert state.status == "failed"
    assert state.failure_code == "INSUFFICIENT_DATA_PARTICIPANTS"
    assert backend.failed is not None
