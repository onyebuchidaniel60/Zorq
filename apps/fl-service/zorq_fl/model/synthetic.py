from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

TEACHER_WEIGHTS = np.array(
    [0.6, -0.8, 0.4, 0.2, -0.3, 0.7, -0.5, 0.1], dtype=np.float32
)
INPUT_FEATURES = 8
SAMPLES_PER_PARTICIPANT = 256
EVALUATION_SAMPLES = 512


class BinaryClassifier(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.linear = nn.Linear(INPUT_FEATURES, 1)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.linear(features).squeeze(-1)


def _dataset(seed: int, samples: int, bias: float) -> TensorDataset:
    rng = np.random.default_rng(seed)
    features = rng.standard_normal((samples, INPUT_FEATURES)).astype(np.float32)
    logits = features @ TEACHER_WEIGHTS + bias
    labels = (1.0 / (1.0 + np.exp(-logits)) >= 0.5).astype(np.float32)
    return TensorDataset(torch.from_numpy(features), torch.from_numpy(labels))


@dataclass(frozen=True)
class SyntheticPartition:
    partition_id: int
    train: TensorDataset
    evaluation: TensorDataset


def partition_for(partition_id: int, data_seed: int) -> SyntheticPartition:
    if partition_id < 0 or partition_id > 4:
        raise ValueError("partitionId must be between 0 and 4")
    bias = (partition_id - 2) * 0.15
    train = _dataset(data_seed + partition_id, SAMPLES_PER_PARTICIPANT, bias)
    evaluation = _dataset(data_seed + 10_000, EVALUATION_SAMPLES, 0.0)
    return SyntheticPartition(partition_id=partition_id, train=train, evaluation=evaluation)


def get_parameters(model: nn.Module) -> list[np.ndarray]:
    return [
        parameter.detach().cpu().numpy().copy()
        for parameter in model.state_dict().values()
    ]


def set_parameters(model: nn.Module, parameters: list[np.ndarray]) -> None:
    state = model.state_dict()
    for key, value in zip(state.keys(), parameters, strict=True):
        state[key] = torch.tensor(value, dtype=state[key].dtype)
    model.load_state_dict(state, strict=True)


def evaluate(model: nn.Module, dataset: TensorDataset) -> tuple[float, float]:
    model.eval()
    loader = DataLoader(dataset, batch_size=128, shuffle=False)
    criterion = nn.BCEWithLogitsLoss()
    total_loss = 0.0
    correct = 0
    total = 0
    with torch.no_grad():
        for features, labels in loader:
            logits = model(features)
            total_loss += float(criterion(logits, labels)) * len(labels)
            predictions = (torch.sigmoid(logits) >= 0.5).float()
            correct += int((predictions == labels).sum())
            total += len(labels)
    return total_loss / max(total, 1), correct / max(total, 1)


def model_hash(model: nn.Module) -> str:
    digest = hashlib.sha256()
    state = model.state_dict()
    for key in sorted(state.keys()):
        tensor = state[key].detach().cpu().contiguous()
        digest.update(key.encode("utf-8"))
        digest.update(str(tensor.dtype).encode("utf-8"))
        digest.update(str(tuple(tensor.shape)).encode("utf-8"))
        digest.update(tensor.numpy().tobytes())
    return f"0x{digest.hexdigest()}"


def evaluation_set(data_seed: int) -> TensorDataset:
    return _dataset(data_seed + 10_000, EVALUATION_SAMPLES, 0.0)


def default_data_seed() -> int:
    return int(os.environ.get("DEMO_DATA_SEED", "20261104"))
