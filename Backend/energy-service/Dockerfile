# Étape 1 : Builder
FROM python:3.9-slim as builder

WORKDIR /app

# Copier d'abord requirements.txt
COPY requirements.txt .

# Installer les dépendances build
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev && \
    pip install --user -r requirements.txt && \
    apt-get remove -y gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Étape 2 : Runtime
FROM python:3.9-slim

WORKDIR /app

# Copier depuis le builder
COPY --from=builder /root/.local /root/.local
COPY . .

# Ajouter au PATH
ENV PATH=/root/.local/bin:$PATH

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]