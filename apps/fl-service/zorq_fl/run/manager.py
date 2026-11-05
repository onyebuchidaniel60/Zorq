from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from zorq_fl.backend.client import BackendError, ZorqBackendClient
from zorq_fl.flower_app.client import ZorqClient
from zorq_fl.flower_app.strategy import (
    AuthorizationFedAvg,
    InsufficientAuthorizedParticipants,
)
from zorq_fl.model.synthetic import (
    BinaryClassifier,
    default_data_seed,
    evaluate,
    evaluation_set,
    get_parameters,
    model_hash,
    set_parameters,
)
import torch
from types import SimpleNamespace
from flwr.common import (
    Code,
    FitRes,
    Status,
    ndarrays_to_parameters,
    parameters_to_ndarrays,
)


class RunFailure(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.public_message = message


@dataclass
class RunState:
    run_id: str
    job_id: str
    total_rounds: int
    participants: list[dict[str, Any]]
    status: str = "accepted"
    current_round: int = 0
    metrics: list[dict[str, Any]] = field(default_factory=list)
    final_model_hash: str | None = None
    failure_code: str | None = None
    failure_message: str | None = None
    started_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def public(self) -> dict[str, Any]:
        return {
            "runId": self.run_id,
            "jobId": self.job_id,
            "status": self.status,
            "currentRound": self.current_round,
            "totalRounds": self.total_rounds,
            "metrics": self.metrics,
            "finalModelHash": self.final_model_hash,
            "failureCode": self.failure_code,
            "failureMessage": self.failure_message,
            "startedAt": self.started_at,
        }


async def run_simulation(
    state: RunState,
    backend: ZorqBackendClient,
    data_seed: int | None = None,
) -> None:
    seed = data_seed or default_data_seed()
    torch.manual_seed(seed)
    model = BinaryClassifier()
    strategy = AuthorizationFedAvg(
        min_fit_clients=2,
        min_available_clients=2,
        min_evaluate_clients=2,
        fraction_fit=1.0,
        fraction_evaluate=1.0,
    )
    parameters = ndarrays_to_parameters(get_parameters(model))
    participant_partitions = {
        str(participant["assetId"]): int(participant["partitionId"])
        for participant in state.participants
    }

    try:
        state.status = "running"
        for round_number in range(1, state.total_rounds + 1):
            snapshot = await backend.authorization_snapshot(state.run_id, round_number)
            allowed = snapshot.get("allowed") or []
            if len(allowed) < 2:
                raise RunFailure(
                    "INSUFFICIENT_AUTHORIZED_PARTICIPANTS",
                    "Fewer than two distinct authorized assets remain.",
                )

            allowed_clients: list[tuple[str, int]] = []
            for entry in allowed:
                asset_id = str(entry.get("assetId", ""))
                partition_id = entry.get("partitionId")
                if partition_id is None:
                    partition_id = participant_partitions.get(asset_id)
                if partition_id is None:
                    raise RunFailure(
                        "INVALID_SNAPSHOT",
                        "An authorized asset has no synthetic partition mapping.",
                    )
                allowed_clients.append((f"p{int(partition_id)}", int(partition_id)))

            allowed_cids = {cid for cid, _ in allowed_clients}
            if len(allowed_cids) != len(allowed_clients):
                raise RunFailure(
                    "INVALID_SNAPSHOT", "Duplicate synthetic partitions in the snapshot."
                )

            strategy.set_allowed(allowed_cids)
            results: list[tuple[SimpleNamespace, FitRes]] = []

            for cid, partition_id in sorted(allowed_clients):
                client = ZorqClient(partition_id, seed)
                arrays, examples, metrics = client.fit(
                    parameters_to_ndarrays(parameters), {"round": round_number}
                )
                results.append(
                    (
                        SimpleNamespace(cid=cid),
                        FitRes(
                            status=Status(code=Code.OK, message=""),
                            parameters=ndarrays_to_parameters(arrays),
                            num_examples=examples,
                            metrics=metrics,
                        ),
                    )
                )

            aggregated, _ = strategy.aggregate_fit(round_number, results, [])
            if aggregated is None:
                raise RunFailure(
                    "AGGREGATION_FAILED", "The coordinator did not produce a model update."
                )

            set_parameters(model, parameters_to_ndarrays(aggregated))
            parameters = aggregated
            loss, accuracy = evaluate(model, evaluation_set(seed))
            state.current_round = round_number
            round_metrics = {
                "round": round_number,
                "loss": round(loss, 6),
                "accuracy": round(accuracy, 6),
                "authorizedCount": len(allowed_clients),
                "aggregatedCount": len(results),
            }
            state.metrics.append(round_metrics)

            await backend.event(
                state.run_id,
                {
                    "type": "round_completed",
                    "roundNumber": round_number,
                    "metrics": {
                        "loss": round_metrics["loss"],
                        "accuracy": round_metrics["accuracy"],
                    },
                    "authorizedCount": round_metrics["authorizedCount"],
                    "aggregatedCount": round_metrics["aggregatedCount"],
                },
            )

        final_hash = model_hash(model)
        final_metrics = state.metrics[-1] if state.metrics else {}
        state.status = "completed"
        state.final_model_hash = final_hash
        await backend.complete(state.run_id, final_hash, final_metrics)
    except InsufficientAuthorizedParticipants as exc:
        state.status = "failed"
        state.failure_code = "INSUFFICIENT_AUTHORIZED_PARTICIPANTS"
        state.failure_message = str(exc)
        await backend.fail(state.run_id, state.failure_code, state.failure_message)
    except RunFailure as exc:
        state.status = "failed"
        state.failure_code = exc.code
        state.failure_message = exc.public_message
        await backend.fail(state.run_id, exc.code, exc.public_message)
    except BackendError as exc:
        state.status = "failed"
        state.failure_code = "AUTHORIZATION_UNAVAILABLE"
        state.failure_message = "The coordinator could not obtain a valid authorization snapshot."
        await backend.fail(
            state.run_id, state.failure_code, state.failure_message
        )
        _ = exc
    except Exception:
        import traceback
        traceback.print_exc()
        state.status = "failed"
        state.failure_code = "FL_SERVICE_ERROR"
        state.failure_message = "The demonstration training run failed."
        try:
            await backend.fail(
                state.run_id, state.failure_code, state.failure_message
            )
        except Exception:
            pass


class RunManager:
    def __init__(
        self,
        backend: ZorqBackendClient,
        max_concurrent_runs: int = 1,
        max_participants: int = 5,
    ) -> None:
        self._backend = backend
        self._max_participants = max_participants
        self._semaphore = asyncio.Semaphore(max_concurrent_runs)
        self._runs: dict[str, RunState] = {}
        self._tasks: dict[str, asyncio.Task[None]] = {}

    def get(self, run_id: str) -> RunState | None:
        return self._runs.get(run_id)

    async def start(
        self,
        run_id: str,
        job_id: str,
        total_rounds: int,
        participants: list[dict[str, Any]],
    ) -> RunState:
        if run_id in self._runs:
            return self._runs[run_id]
        if total_rounds != 3:
            raise ValueError("The MVP runs exactly three rounds")
        if not 2 <= len(participants) <= self._max_participants:
            raise ValueError("The MVP supports two to five participants")
        if self._semaphore.locked():
            raise RuntimeError("The FL service already has an active run")

        state = RunState(
            run_id=run_id,
            job_id=job_id,
            total_rounds=total_rounds,
            participants=participants,
        )
        self._runs[run_id] = state

        async def execute() -> None:
            async with self._semaphore:
                await run_simulation(state, self._backend)

        self._tasks[run_id] = asyncio.create_task(execute())
        return state

    async def shutdown(self) -> None:
        for task in self._tasks.values():
            task.cancel()
