# ── STAGE 1: Base image ──────────────────────────────────
# Use official Python 3.11 slim image (smaller than full image)
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1   
ENV PYTHONUNBUFFERED=1          
ENV MODEL_DIR=/app/models


# ── STAGE 2: Install dependencies ───────────────────────
# Copy requirements FIRST (so Docker can cache this layer)
# If only code changes but not requirements, this layer is reused = faster builds
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt


# ── STAGE 3: Copy application code ──────────────────────
# Copy app code after requirements (takes advantage of layer caching)
COPY . .

# Create directory for model files
RUN mkdir -p /app/models /app/data


# ── STAGE 4: Configure the container ────────────────────
# Expose port 5001 (Flask will listen here)
EXPOSE 5001

# Health check: Docker will call this to verify container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')" || exit 1

# Run the Flask app using Gunicorn (production WSGI server)
# Gunicorn is better than Flask's built-in server for production
# --workers 2: handle 2 requests simultaneously
# --timeout 120: wait 120s for predictions (some models are slow)
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5001", "--timeout", "120", "--log-level", "info", "app:app"]