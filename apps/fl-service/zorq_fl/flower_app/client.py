from __future__ import annotations

from typing import Any

from flwr.client import NumPyClient
from flwr.common import NDArrays, Scalar
import torch
from torch import nn
from torch.utils.data import DataLoader

from zorq_fl.model.external import ExternalDataError, load_external_partition
from zorq_fl.model.synthetic import (
    BinaryClassifier,
    evaluate,
    get_parameters,
    partition_for,
    set_parameters,
)


class ZorqClient(NumPyClient):
    def __init__(
        self,
        partition_id: int | None,
        data_seed: int,
        external: dict[str, Any] | None = None,
    ) -> None:
        if external:
            self.dataset = load_external_partition(
                db_url=str(external.get("dbUrl") or ""),
                table_name=str(external.get("dbTable") or ""),
                label_column=str(external.get("labelColumn") or "label"),
                data_seed=data_seed,
            )
            self.source = "external"
        else:
            if partition_id is None:
                raise ExternalDataError("A demo participant has no partition mapping.")
            self.dataset = partition_for(partition_id, data_seed)
            self.source = "demo"
        self.partition_id = partition_id
        self.data_seed = data_seed
        self.model = BinaryClassifier()

    def get_parameters(self, config: dict[str, Scalar]) -> NDArrays:
        return get_parameters(self.model)

    def fit(
        self, parameters: NDArrays, config: dict[str, Scalar]
    ) -> tuple[NDArrays, int, dict[str, Scalar]]:
        set_parameters(self.model, parameters)
        torch.manual_seed(
            self.data_seed * 100
            + (self.partition_id if self.partition_id is not None else 97)
            + int(config.get("round", 0))
        )
        self.model.train()
        loader = DataLoader(self.dataset.train, batch_size=32, shuffle=True)
        optimizer = torch.optim.SGD(self.model.parameters(), lr=0.05)
        criterion = nn.BCEWithLogitsLoss()

        for _ in range(2):
            for features, labels in loader:
                optimizer.zero_grad()
                loss = criterion(self.model(features), labels)
                loss.backward()
                optimizer.step()

        loss, accuracy = evaluate(self.model, self.dataset.train)
        return (
            get_parameters(self.model),
            len(self.dataset.train),
            {"train_loss": loss, "train_accuracy": accuracy, "source": self.source},
        )

    def evaluate(
        self, parameters: NDArrays, config: dict[str, Scalar]
    ) -> tuple[float, int, dict[str, Scalar]]:
        set_parameters(self.model, parameters)
        loss, accuracy = evaluate(self.model, self.dataset.evaluation)
        return loss, len(self.dataset.evaluation), {"accuracy": accuracy}
