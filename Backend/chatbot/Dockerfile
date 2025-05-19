FROM rasa/rasa:3.0.0

USER root

# Crée le répertoire de travail avec les permissions
RUN mkdir -p /app && \
    chown -R 1001:0 /app && \
    chmod -R g+rwX /app

WORKDIR /app

# Copie les fichiers, y compris requirements.txt (assure-toi qu’il existe !)
COPY --chown=1001:0 . .

# Installe les dépendances système
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Ne force pas une version incompatible de `requests`
# Installe juste requirements.txt si le fichier est présent
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

USER 1001

CMD ["rasa", "run", "--enable-api", "--cors", "*", "--port", "5005"]
