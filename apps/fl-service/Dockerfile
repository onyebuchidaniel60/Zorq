FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN pip install --no-cache-dir uv==0.13.7

COPY pyproject.toml uv.lock README.md ./
COPY zorq_fl ./zorq_fl

RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uv", "run", "--no-dev", "uvicorn", "zorq_fl.main:app", "--host", "0.0.0.0", "--port", "8000"]
