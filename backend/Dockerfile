# syntax=docker/dockerfile:1
# Multi-stage production build for FraudGuard AI Backend

# Stage 1: Build virtual environment and dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml README.md ./
RUN pip install --upgrade pip && pip install .

# Stage 2: Minimal runtime container
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000 \
    HOST=0.0.0.0

# Create non-root user and group
RUN groupadd --gid 10001 appgroup && \
    useradd --uid 10001 --gid 10001 --create-home --shell /bin/bash appuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY app ./app
COPY scripts ./scripts
COPY pyproject.toml README.md ./

# Create uploads and data directories with proper permissions
RUN mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Bind to 0.0.0.0 and accept dynamic PORT from Azure App Service / Container Apps
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
