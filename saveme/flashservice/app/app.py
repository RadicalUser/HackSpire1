"""
Flask API for the Anomaly Detection Service

This module provides a REST API interface to the blockchain anomaly detection model.
It exposes endpoints for anomaly detection on transaction data.
"""

from flask import Flask, request, jsonify
import os
import sys
import json
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler
import traceback
import importlib.util

# Import configuration
from .config import DEBUG, HOST, PORT, API_PREFIX, MODEL_PATH

# Dynamically import main.py from the correct absolute path
main_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../model/src/main.py'))
if not os.path.exists(main_path):
    raise ImportError(f"main.py not found at {main_path}")
spec = importlib.util.spec_from_file_location('main', main_path)
main = importlib.util.module_from_spec(spec)
sys.modules['main'] = main
spec.loader.exec_module(main)

detect_anomalies = main.detect_anomalies
setup_environment = main.setup_environment

# Initialize Flask app
app = Flask(__name__)

# Configure logging
if not os.path.exists('../logs'):
    os.makedirs('../logs')

file_handler = RotatingFileHandler(
    f'../logs/flask_app_{datetime.now().strftime("%Y%m%d")}.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)

# Set up the anomaly detection environment
setup_environment()

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to ensure the API is working.
    """
    return jsonify({
        'status': 'ok', 
        'timestamp': datetime.now().isoformat()
    })

@app.route(f'{API_PREFIX}/detect', methods=['POST'])
def detect_anomalies_endpoint():
    """
    Endpoint to detect anomalies in blockchain transactions.
    
    Expected POST body:
    {
        "transactions": [
            {
                "hash": "0x123...",
                "timeStamp": "1678901234",
                "value": "1000000000000000000",
                "gas": "21000",
                "gasPrice": "50000000000"
            },
            ...
        ]
    }
    
    Returns: JSON object with anomaly detection results
    """
    try:
        # Check if the request contains JSON data
        if not request.is_json:
            app.logger.error("Request did not contain JSON data")
            return jsonify({'error': 'Request must be JSON'}), 400
        
        # Get the JSON data
        data = request.get_json()
        
        # Check if 'transactions' is in the data
        if 'transactions' not in data:
            app.logger.error("Request did not contain 'transactions' key")
            return jsonify({'error': 'Missing transactions data'}), 400
        
        transactions = data['transactions']
        
        # Check if transactions is not empty
        if not transactions:
            app.logger.error("Empty transactions array provided")
            return jsonify({'error': 'No transactions provided'}), 400
        
        app.logger.info(f"Processing {len(transactions)} transactions")
        
        # Process the transactions through the anomaly detection model
        try:
            results = detect_anomalies(transactions, MODEL_PATH)
            app.logger.info(f"Successfully processed {len(results)} results")
            
            # Return the results
            return jsonify(results)
        
        except Exception as e:
            app.logger.error(f"Error in model processing: {str(e)}", exc_info=True)
            traceback.print_exc()  # Log full traceback
            return jsonify({
                'error': 'Error processing transactions', 
                'message': str(e)
            }), 500
    
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        traceback.print_exc()  # Log full traceback
        return jsonify({
            'error': 'Internal server error', 
            'message': str(e)
        }), 500

@app.route(f'{API_PREFIX}/batch-detect', methods=['POST'])
def batch_detect_anomalies():
    """
    Endpoint to detect anomalies in multiple batches of blockchain transactions.
    
    Expected POST body:
    {
        "batches": [
            {
                "batch_id": "batch1",
                "transactions": [...]
            },
            {
                "batch_id": "batch2",
                "transactions": [...]
            }
        ]
    }
    
    Returns: JSON object with anomaly detection results for each batch
    """
    try:
        # Check if the request contains JSON data
        if not request.is_json:
            app.logger.error("Request did not contain JSON data")
            return jsonify({'error': 'Request must be JSON'}), 400
        
        # Get the JSON data
        data = request.get_json()
        
        # Check if 'batches' is in the data
        if 'batches' not in data:
            app.logger.error("Request did not contain 'batches' key")
            return jsonify({'error': 'Missing batches data'}), 400
        
        batches = data['batches']
        
        # Check if batches is not empty
        if not batches:
            app.logger.error("Empty batches array provided")
            return jsonify({'error': 'No batches provided'}), 400
        
        app.logger.info(f"Processing {len(batches)} batches")
        
        # Process each batch through the anomaly detection model
        results = {}
        try:
            for batch in batches:
                batch_id = batch.get('batch_id', 'unknown')
                transactions = batch.get('transactions', [])
                
                if transactions:
                    batch_results = detect_anomalies(transactions, MODEL_PATH)
                    results[batch_id] = batch_results
                    app.logger.info(f"Successfully processed batch '{batch_id}' with {len(batch_results)} results")
                else:
                    results[batch_id] = []
                    app.logger.warning(f"Empty transactions array in batch '{batch_id}'")
            
            # Return the results
            return jsonify({
                'batch_results': results,
                'total_batches_processed': len(results)
            })
        
        except Exception as e:
            app.logger.error(f"Error in model processing: {str(e)}", exc_info=True)
            return jsonify({
                'error': 'Error processing transactions', 
                'message': str(e)
            }), 500
    
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error', 
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Run the Flask app
    app.run(host=HOST, port=PORT, debug=DEBUG)