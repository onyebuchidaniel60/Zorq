from __future__ import annotations

from typing import Any

import httpx


class BackendError(RuntimeError):
    pass


class ZorqBackendClient:
    def __init__(self, base_url: str, token: str, timeout_seconds: float = 15.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._headers = {"Authorization": f"Bearer {token}"}
        self._timeout = timeout_seconds

    async def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self._base_url}{path}", json=body, headers=self._headers
            )
        if response.status_code >= 400:
            raise BackendError(
                f"{path} returned {response.status_code}: {response.text[:300]}"
            )
        return response.json()

    async def authorization_snapshot(
        self, run_id: str, round_number: int
    ) -> dict[str, Any]:
        return await self._post(
            f"/api/internal/runs/{run_id}/authorization-snapshot",
            {"roundNumber": round_number},
        )

    async def event(self, run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._post(f"/api/internal/runs/{run_id}/events", payload)

    async def complete(
        self, run_id: str, final_model_hash: str, metrics: dict[str, Any]
    ) -> dict[str, Any]:
        return await self._post(
            f"/api/internal/runs/{run_id}/complete",
            {"finalModelHash": final_model_hash, "aggregateMetrics": metrics},
        )

    async def fail(
        self, run_id: str, failure_code: str, public_message: str
    ) -> dict[str, Any]:
        return await self._post(
            f"/api/internal/runs/{run_id}/fail",
            {"failureCode": failure_code, "publicMessage": public_message},
        )
