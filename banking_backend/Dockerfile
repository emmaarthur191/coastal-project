# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production image
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PATH="/home/django/.local/bin:${PATH}"

WORKDIR /app

# Create a non-privileged user and group
RUN groupadd -r django && useradd -r -g django -d /home/django -s /sbin/nologin django \
    && mkdir -p /home/django/.local /app/staticfiles /app/media \
    && chown -R django:django /home/django /app

# Install runtime dependencies ONLY
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy project files with proper ownership
COPY --chown=django:django . .

# Ensure entrypoint is executable
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER django

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["daphne", "config.asgi:application", "-b", "0.0.0.0", "-p", "8000"]
