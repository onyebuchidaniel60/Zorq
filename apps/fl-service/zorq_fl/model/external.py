from __future__ import annotations

import re
from dataclasses import dataclass

import numpy as np
import pandas as pd
import torch
from sqlalchemy import create_engine, text
from torch.utils.data import TensorDataset

INPUT_FEATURES = 8
MAX_ROWS = 1000


class ExternalDataError(RuntimeError):
    """A safe, user-facing external data failure without connection secrets."""


@dataclass(frozen=True)
class ExternalPartition:
    train: TensorDataset
    evaluation: TensorDataset
    row_count: int


def _normalized_url(db_url: str) -> str:
    if db_url.startswith("postgres://"):
        return "postgresql+psycopg://" + db_url.removeprefix("postgres://")
    if db_url.startswith("postgresql://"):
        return "postgresql+psycopg://" + db_url.removeprefix("postgresql://")
    return db_url


def _quoted_table(table_name: str) -> str:
    parts = table_name.split(".")
    if not 1 <= len(parts) <= 2:
        raise ExternalDataError("The external table name is invalid.")
    for part in parts:
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", part):
            raise ExternalDataError("The external table name is invalid.")
    return ".".join(f'"{part}"' for part in parts)


def _normalise_labels(series: pd.Series) -> np.ndarray:
    if pd.api.types.is_bool_dtype(series):
        values = series.astype(np.float32).to_numpy()
    elif pd.api.types.is_numeric_dtype(series):
        values = pd.to_numeric(series, errors="coerce").to_numpy(dtype=np.float32)
    else:
        normalised = series.astype(str).str.strip().str.lower()
        positive = {"1", "true", "yes", "y", "positive", "pos"}
        negative = {"0", "false", "no", "n", "negative", "neg"}
        unique = set(normalised.unique())
        if unique <= positive | negative:
            values = normalised.isin(positive).astype(np.float32).to_numpy()
        elif len(unique) == 2:
            ordered = sorted(unique)
            values = (normalised == ordered[1]).astype(np.float32).to_numpy()
        else:
            raise ExternalDataError(
                "The label column must contain a binary target (0/1, true/false or two classes)."
            )

    finite = np.isfinite(values)
    if not finite.any():
        raise ExternalDataError("The label column contains no usable values.")
    unique = np.unique(values[finite])
    if unique.size < 2:
        raise ExternalDataError("The label column must contain two target classes.")
    if unique.size == 2 and not np.array_equal(unique, np.array([0.0, 1.0])):
        values = (values == unique[1]).astype(np.float32)
    elif unique.size > 2:
        values = (values > float(np.nanmedian(values))).astype(np.float32)
    return np.nan_to_num(values, nan=0.0, posinf=1.0, neginf=0.0)


def load_external_partition(
    db_url: str,
    table_name: str,
    label_column: str,
    data_seed: int,
) -> ExternalPartition:
    if not db_url:
        raise ExternalDataError("The external database URL is missing.")
    if not label_column or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", label_column):
        raise ExternalDataError("The target label column is invalid.")

    normalized_url = _normalized_url(db_url)
    engine = create_engine(
        normalized_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 5}
        if normalized_url.startswith(("postgresql", "postgres"))
        else {},
    )
    try:
        query = text(f"SELECT * FROM {_quoted_table(table_name)} LIMIT {MAX_ROWS}")
        with engine.connect() as connection:
            frame = pd.read_sql_query(query, connection)
    except ExternalDataError:
        raise
    except Exception as exc:
        raise ExternalDataError("The external database could not be read.") from exc
    finally:
        engine.dispose()

    if frame.empty:
        raise ExternalDataError("The external table returned no rows.")

    label_name = next(
        (column for column in frame.columns if str(column).lower() == label_column.lower()),
        None,
    )
    if label_name is None:
        raise ExternalDataError("The target label column was not found in the external table.")

    labels = _normalise_labels(frame[label_name])
    feature_frame = frame.drop(columns=[label_name]).select_dtypes(
        include=["number", "bool"]
    )
    if feature_frame.shape[1] == 0:
        raise ExternalDataError("The external table has no numeric feature columns.")

    features = feature_frame.to_numpy(dtype=np.float32)
    features = np.nan_to_num(features, nan=0.0, posinf=1.0, neginf=-1.0)
    if features.shape[1] < INPUT_FEATURES:
        padding = np.zeros(
            (features.shape[0], INPUT_FEATURES - features.shape[1]),
            dtype=np.float32,
        )
        features = np.concatenate([features, padding], axis=1)
    else:
        features = features[:, :INPUT_FEATURES]

    sample_count = len(features)
    if sample_count < 4:
        raise ExternalDataError("The external table needs at least four rows.")

    rng = np.random.default_rng(data_seed)
    indices = rng.permutation(sample_count)
    evaluation_count = max(1, min(256, sample_count // 5))
    evaluation_indices = indices[:evaluation_count]
    training_indices = indices[evaluation_count:]
    if training_indices.size == 0:
        training_indices = evaluation_indices

    def dataset(index: np.ndarray) -> TensorDataset:
        return TensorDataset(
            torch.from_numpy(features[index].copy()),
            torch.from_numpy(labels[index].copy()),
        )

    return ExternalPartition(
        train=dataset(training_indices),
        evaluation=dataset(evaluation_indices),
        row_count=sample_count,
    )
