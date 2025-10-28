# Use official Python image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose the Django port
EXPOSE 8000

# Command to run Django server

CMD ["sh", "-c", "python manage.py migrate && \
  python manage.py loaddata weather_seed.json && \
  python manage.py loaddata clothing_types_seed.json && \
  python manage.py loaddata styles_seed.json && \
  python manage.py runserver 0.0.0.0:8000"]
