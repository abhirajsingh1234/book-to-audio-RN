# Use official Python image
FROM python:3.9

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start FastAPI with Uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
