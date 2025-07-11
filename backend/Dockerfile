# Use official Python image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libgl1 \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create required directories
RUN mkdir -p /models /app/media && chmod -R 777 /models /app/media

# Expose port
EXPOSE 8000

# Set environment variables (override in production as needed)
ENV PYTHONUNBUFFERED=1

# Collect static files (if needed)
# RUN python manage.py collectstatic --noinput

# Start the Django app (use gunicorn for production)
CMD ["gunicorn", "memoir.wsgi:application", "--bind", "0.0.0.0:8000"] 