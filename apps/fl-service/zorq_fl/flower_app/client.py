from __future__ import annotations

from flwr.client import NumPyClient
from flwr.common import NDArrays, Scalar
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from zorq_fl.model.synthetic import (
    BinaryClassifier,
    evaluate,
    get_parameters,
    partition_for,
    set_parameters,
)


class ZorqClient(NumPyClient):
    def __init__(self, partition_id: int, data_seed: int) -> None:
        self.partition_id = partition_id
        self.data_seed = data_seed
        self.partition = partition_for(partition_id, data_seed)
        self.model = BinaryClassifier()

    def get_parameters(self, config: dict[str, Scalar]) -> NDArrays:
        return get_parameters(self.model)

    def fit(
        self, parameters: NDArrays, config: dict[str, Scalar]
    ) -> tuple[NDArrays, int, dict[str, Scalar]]:
        set_parameters(self.model, parameters)
        torch.manual_seed(self.data_seed * 100 + self.partition_id + int(config.get("round", 0)))
        self.model.train()
        loader = DataLoader(self.partition.train, batch_size=32, shuffle=True)
        optimizer = torch.optim.SGD(self.model.parameters(), lr=0.05)
        criterion = nn.BCEWithLogitsLoss()

        for _ in range(2):
            for features, labels in loader:
                optimizer.zero_grad()
                loss = criterion(self.model(features), labels)
                loss.backward()
                optimizer.step()

        loss, accuracy = evaluate(self.model, self.partition.train)
        return (
            get_parameters(self.model),
            len(self.partition.train),
            {"train_loss": loss, "train_accuracy": accuracy},
        )

    def evaluate(
        self, parameters: NDArrays, config: dict[str, Scalar]
    ) -> tuple[float, int, dict[str, Scalar]]:
        set_parameters(self.model, parameters)
        loss, accuracy = evaluate(self.model, self.partition.evaluation)
        return loss, len(self.partition.evaluation), {"accuracy": accuracy}
