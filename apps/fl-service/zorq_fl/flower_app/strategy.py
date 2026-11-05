from __future__ import annotations

from flwr.server.strategy import FedAvg
from flwr.common import FitRes
from flwr.server.client_proxy import ClientProxy


class InsufficientAuthorizedParticipants(RuntimeError):
    pass


class AuthorizationFedAvg(FedAvg):
    """FedAvg that aggregates only updates from the current snapshot allowlist."""

    allowed_cids: set[str]

    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.allowed_cids = set()

    def set_allowed(self, allowed_cids: set[str]) -> None:
        self.allowed_cids = set(allowed_cids)

    def aggregate_fit(
        self,
        server_round: int,
        results: list[tuple[ClientProxy, FitRes]],
        failures: list[tuple[ClientProxy, FitRes] | BaseException],
    ):
        filtered = [
            (proxy, result)
            for proxy, result in results
            if proxy.cid in self.allowed_cids
        ]
        if len(filtered) < 2:
            raise InsufficientAuthorizedParticipants(
                "Fewer than two authorized participant updates reached aggregation"
            )
        return super().aggregate_fit(server_round, filtered, failures)
