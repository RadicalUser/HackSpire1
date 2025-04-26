#!/bin/bash

# Start the Anomaly Detection Flask Service
# This script sets up the environment and runs the Flask app

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    . venv/bin/activate
    pip install -r requirements.txt
else
    echo "Activating virtual environment..."
    . venv/bin/activate
fi

# Set environment variables (modify as needed)
export FLASK_APP=wsgi.py
export FLASK_ENV=development
export FLASK_HOST=0.0.0.0
export FLASK_PORT=5000
export FLASK_DEBUG=true

# Optional: Set the path to the model files
export MODEL_PATH="../model/models"

echo "Starting Flask service on $FLASK_HOST:$FLASK_PORT..."
echo "API endpoints:"
echo " - Health check: http://$FLASK_HOST:$FLASK_PORT/health"
echo " - Detect anomalies: http://$FLASK_HOST:$FLASK_PORT/api/v1/detect"
echo " - Batch detect: http://$FLASK_HOST:$FLASK_PORT/api/v1/batch-detect"

# Run the flask app
flask run --host=$FLASK_HOST --port=$FLASK_PORT