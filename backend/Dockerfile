FROM python:3.11-slim

WORKDIR /app
COPY app/ ./app
COPY requirements.txt .

# copy service account json (DO NOT commit to git)
COPY serviceAccountKey.json /app/serviceAccountKey.json

RUN pip install --no-cache-dir -r requirements.txt

ENV GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
