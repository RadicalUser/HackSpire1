"""
main.py

This is the main entry point of the application. It orchestrates the entire workflow from fetching transaction data
via the Etherscan API, performing data cleaning and transformation, detecting anomalies, and visualizing results.

Adheres to the Single Responsibility Principle (SRP) by coordinating all system operations in a structured manner.
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
from multiprocessing import freeze_support
from dotenv import load_dotenv
import sys
import shutil

# Add the parent directory to sys.path to enable imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import from local modules using absolute imports
from src.api.etherscan_api import EtherscanAPI
from src.data_processing.data_cleaning import DataCleaner
from src.data_processing.data_transformation import DataTransformer
from src.anomaly_detection.isolation_forest import AnomalyDetectorIsolationForest
from src.utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle special data types."""
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
            np.int16, np.int32, np.int64, np.uint8,
            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, (pd.Timestamp, datetime)):
            return obj.isoformat()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

def setup_environment():
    """
    Set up the environment variables and create necessary directories.
    """
    # Load environment variables
    load_dotenv()
    
    # Create necessary directories
    for directory in ['models', 'logs', 'data']:
        if not os.path.exists(directory):
            os.makedirs(directory)

def train_model(data=None, input_file=None):
    """
    Train the anomaly detection model using either provided data or fetching from Etherscan.
    
    :param data: Optional DataFrame or list of transactions for training
    :param input_file: Optional file path to load transactions from
    :return: Trained model
    """
    try:
        # First, try to use provided data or input file
        if data is None and input_file is not None:
            logger.info(f"Loading transactions from {input_file} for training")
            try:
                with open(input_file, 'r') as f:
                    json_data = json.load(f)
                    transactions = json_data.get('transactions', [])
                    
                if not transactions:
                    logger.warning(f"No transactions found in {input_file}")
                    raise ValueError(f"No transactions found in {input_file}")
                    
                data = pd.DataFrame(transactions)
                logger.info(f"Loaded {len(transactions)} transactions from file for training")
            except Exception as e:
                logger.error(f"Error loading transactions from file: {str(e)}")
                raise
                
        # If still no data, try to fetch from Etherscan
        if data is None:
            # Fetch data from Etherscan
            api_key = os.getenv("ETHERSCAN_API_KEY")
            address = os.getenv("ETHERSCAN_ADDRESS")
            
            if not api_key or not address:
                raise ValueError("Missing API key or Ethereum address in environment variables")
            
            api = EtherscanAPI(api_key=api_key)
            transactions = api.get_transactions(address)
            
            if not transactions:
                raise ValueError("Failed to fetch transactions from Etherscan")
            
            data = pd.DataFrame(transactions)
        elif isinstance(data, list):
            data = pd.DataFrame(data)
        
        # Clean and transform data
        cleaner = DataCleaner(data)
        cleaned_data = cleaner.clean_data()
        
        transformer = DataTransformer(cleaned_data)
        transformed_data = transformer.transform_data()
        
        # Train model
        detector = AnomalyDetectorIsolationForest(transformed_data)
        detector.prepare_features()
        detector.train_model()
        
        # Save model
        saved = detector.save_model()
        if saved:
            logger.info("Model trained and saved successfully")
        else:
            logger.warning("Model trained but could not be saved")
        
        return detector
    
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}", exc_info=True)
        raise

def detect_anomalies(transactions, model_path='models'):
    """
    Detect anomalies in the provided transactions.
    
    :param transactions: List of transaction dictionaries or DataFrame
    :param model_path: Path to the saved model files
    :return: List of dictionaries containing anomaly detection results
    """
    try:
        # Convert transactions to DataFrame if needed
        if isinstance(transactions, list):
            df = pd.DataFrame(transactions)
        else:
            df = transactions
        
        # Clean and transform data
        cleaner = DataCleaner(df)
        cleaned_data = cleaner.clean_data()
        
        transformer = DataTransformer(cleaned_data)
        transformed_data = transformer.transform_data()
        
        # Check if model exists
        model_files_exist = (
            os.path.exists(os.path.join(model_path, 'isolation_forest.joblib')) and
            os.path.exists(os.path.join(model_path, 'scaler.joblib')) and
            os.path.exists(os.path.join(model_path, 'thresholds.joblib'))
        )
        
        # If model doesn't exist or there's a version compatibility issue, train a new one
        detector = None
        try:
            if model_files_exist:
                detector = AnomalyDetectorIsolationForest.load_model(model_path)
        except Exception as e:
            logger.warning(f"Could not load model: {str(e)}")
            logger.info("Will train a new model with current data")
            
            # Remove old model files that might be corrupt or incompatible
            for filename in ['isolation_forest.joblib', 'scaler.joblib', 'thresholds.joblib']:
                file_path = os.path.join(model_path, filename)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logger.info(f"Removed old model file: {file_path}")
                    except Exception as del_err:
                        logger.warning(f"Could not remove old file {file_path}: {str(del_err)}")
        
        # If model couldn't be loaded, train a new one
        if detector is None:
            detector = AnomalyDetectorIsolationForest(transformed_data)
            detector.prepare_features()
            detector.train_model()
            detector.save_model(model_path)
        else:
            # Set data for existing detector
            detector.df = transformed_data
            detector.prepare_features()
            
        results_df = detector.detect_anomalies()
        
        # Extract results
        results = results_df['anomaly_result'].tolist()
        return results
    
    except Exception as e:
        logger.error(f"Error during anomaly detection: {str(e)}", exc_info=True)
        raise

def process_json_input(input_file, output_file=None, should_train=False):
    """
    Process transactions from a JSON file and detect anomalies.
    
    :param input_file: Path to input JSON file
    :param output_file: Path to output JSON file (optional)
    :param should_train: Whether to train a new model
    :return: Detection results
    """
    try:
        # Load transactions from JSON file
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        transactions = data.get('transactions', [])
        if not transactions:
            raise ValueError("No transactions found in input file")
        
        # Train model if requested or if no model exists
        if should_train:
            logger.info("Training new model using input file data...")
            train_model(input_file=input_file)
        
        # Detect anomalies
        results = detect_anomalies(transactions)
        
        # Save results if output file is specified
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2, cls=JSONEncoder)
            logger.info(f"Results saved to {output_file}")
        
        return results
    
    except Exception as e:
        logger.error(f"Error processing JSON input: {str(e)}", exc_info=True)
        raise

def main():
    """
    Main function that handles command line arguments and runs the application.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Blockchain Transaction Anomaly Detection')
    parser.add_argument('--input', '-i', help='Path to input JSON file containing transactions')
    parser.add_argument('--output', '-o', help='Path to output JSON file for results')
    parser.add_argument('--train', '-t', action='store_true', help='Train a new model')
    parser.add_argument('--fetch', '-f', action='store_true', help='Fetch new training data from Etherscan')
    
    args = parser.parse_args()
    
    try:
        setup_environment()
        
        if args.fetch:
            logger.info("Fetching new training data from Etherscan...")
            train_model()
        elif args.input and args.train:
            logger.info(f"Training new model with data from {args.input}")
            train_model(input_file=args.input)
        
        if args.input:
            logger.info(f"Processing transactions from {args.input}")
            results = process_json_input(args.input, args.output, should_train=args.train)
            
            if not args.output:
                print(json.dumps(results, indent=2, cls=JSONEncoder))
        
    except Exception as e:
        logger.error(f"Application error: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    freeze_support()
    main()