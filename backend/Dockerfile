FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python download_model.py && useradd --uid 10001 --create-home app && mkdir -p /data && chown app:app /data
USER app
ENV DATA_DIR=/data
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --no-access-log --no-proxy-headers"]