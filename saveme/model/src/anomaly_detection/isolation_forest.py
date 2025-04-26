"""
isolation_forest.py

This module provides functionality for anomaly detection in transaction data using the Isolation Forest algorithm.
Isolation Forest is particularly well-suited for detecting outliers in high-dimensional datasets.

Adheres to the Single Responsibility Principle (SRP) by focusing only on anomaly detection.
"""

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np
import joblib
import os
import sys
from pathlib import Path
from ..utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)


class AnomalyDetectorIsolationForest:
    """
    AnomalyDetectorIsolationForest uses the Isolation Forest algorithm to detect anomalies in transaction data.
    """

    def __init__(self, df: pd.DataFrame = None, contamination: float = 0.01, random_state: int = 42, should_prepare: bool = True):
        """
        Initializes the anomaly detection model with the provided data.

        :param df: DataFrame containing the transaction data.
        :param contamination: The proportion of outliers in the data set (default is 1%).
        :param random_state: Seed for the random number generator to ensure reproducibility.
        :param should_prepare: Whether to prepare features immediately (default True).
        """
        self.df = df.copy() if df is not None else pd.DataFrame()
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(contamination=self.contamination,
                                     random_state=self.random_state)
        self.scaler = StandardScaler()
        self.thresholds = {}
        self.features = None
        self.scaled_features = None
        
        if should_prepare and not self.df.empty:
            try:
                self.prepare_features()
            except Exception as e:
                logger.error(f"Error preparing features: {str(e)}")
                raise

    def prepare_features(self):
        """
        Prepare and scale features for anomaly detection.
        """
        if self.df.empty:
            logger.warning("Cannot prepare features: DataFrame is empty")
            return
        
        try:
            # Make a copy to avoid SettingWithCopyWarning
            self.df = self.df.copy()
            
            # Check required columns exist
            required_columns = ['value', 'gas', 'gasPrice']
            missing_columns = [col for col in required_columns if col not in self.df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
                
            # Convert values to numeric
            self.df['value'] = pd.to_numeric(self.df['value'], errors='coerce')
            self.df['gas'] = pd.to_numeric(self.df['gas'], errors='coerce')
            self.df['gasPrice'] = pd.to_numeric(self.df['gasPrice'], errors='coerce')
            
            # Fill NaN values with appropriate defaults
            self.df['value'].fillna(0, inplace=True)
            self.df['gas'].fillna(0, inplace=True)
            self.df['gasPrice'].fillna(0, inplace=True)
            
            # Calculate additional features
            self.df['value_per_gas'] = self.df.apply(
                lambda row: row['value'] / row['gas'] if row['gas'] > 0 else 0, 
                axis=1
            )
            self.df['total_gas_cost'] = self.df['gas'] * self.df['gasPrice']
            
            # Select features for analysis
            self.features = self.df[['value', 'gas', 'gasPrice', 'value_per_gas', 'total_gas_cost']]
            
            # Scale features
            self.scaled_features = self.scaler.fit_transform(self.features)
            logger.info("Features prepared successfully")
        except Exception as e:
            logger.error(f"Error in prepare_features: {str(e)}")
            raise

    def train_model(self):
        """
        Trains the Isolation Forest model and calculates thresholds for anomaly types.

        :return: Trained Isolation Forest model.
        """
        if self.scaled_features is None or len(self.scaled_features) == 0:
            error_msg = "Cannot train model: No features prepared"
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        try:
            logger.info("Training Isolation Forest model...")
            self.model.fit(self.scaled_features)
            
            # Calculate thresholds for different types of anomalies
            self.thresholds = {
                'value': np.percentile(self.features['value'], 95),
                'gas': np.percentile(self.features['gas'], 95),
                'gasPrice': np.percentile(self.features['gasPrice'], 95),
                'value_per_gas': np.percentile(self.features['value_per_gas'], 95)
            }
            
            logger.info("Model training completed.")
            return self.model
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def identify_anomaly_type(self, row):
        """
        Identify specific types of anomalies in a transaction.

        :param row: DataFrame row containing transaction data
        :return: List of dictionaries containing anomaly types and details
        """
        try:
            anomaly_types = []
            
            if row['value'] > self.thresholds['value']:
                anomaly_types.append({
                    'type': 'high_value_transaction',
                    'severity': 'high',
                    'details': f"Transaction value ({row['value']}) exceeds threshold ({self.thresholds['value']})"
                })
            
            if row['gas'] > self.thresholds['gas']:
                anomaly_types.append({
                    'type': 'high_gas_consumption',
                    'severity': 'medium',
                    'details': f"Gas usage ({row['gas']}) exceeds threshold ({self.thresholds['gas']})"
                })
            
            if row['gasPrice'] > self.thresholds['gasPrice']:
                anomaly_types.append({
                    'type': 'high_gas_price',
                    'severity': 'medium',
                    'details': f"Gas price ({row['gasPrice']}) exceeds threshold ({self.thresholds['gasPrice']})"
                })
            
            if row['value_per_gas'] > self.thresholds['value_per_gas']:
                anomaly_types.append({
                    'type': 'unusual_value_gas_ratio',
                    'severity': 'low',
                    'details': f"Value/gas ratio ({row['value_per_gas']}) is unusually high"
                })
            
            return anomaly_types if anomaly_types else [{'type': 'normal', 'severity': 'none', 'details': 'No anomalies detected'}]
        except Exception as e:
            logger.error(f"Error identifying anomaly type: {str(e)}")
            return [{'type': 'error', 'severity': 'none', 'details': f'Error analyzing transaction: {str(e)}'}]

    def detect_anomalies(self):
        """
        Detects anomalies in the dataset using the trained Isolation Forest model.

        :return: DataFrame with detailed anomaly information.
        """
        if self.model is None or not hasattr(self.model, 'predict'):
            error_msg = "Model not trained. Call train_model() first."
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        if self.scaled_features is None or self.features is None:
            error_msg = "Features not prepared. Call prepare_features() first."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            logger.info("Detecting anomalies using Isolation Forest model...")
            predictions = self.model.predict(self.scaled_features)
            
            # Create results list
            results = []
            for i, (idx, row) in enumerate(self.features.iterrows()):
                if i >= len(predictions):
                    logger.warning(f"Index {i} out of bounds for predictions array")
                    continue
                    
                if predictions[i] == -1:  # If anomaly
                    anomaly_types = self.identify_anomaly_type(row)
                    is_anomaly = True
                else:
                    anomaly_types = [{'type': 'normal', 'severity': 'none', 'details': 'No anomalies detected'}]
                    is_anomaly = False
                
                # Safely get the original row from DataFrame
                orig_row = self.df.iloc[self.df.index.get_loc(idx)] if idx in self.df.index else {}
                
                # Convert timestamp to string if it exists
                timestamp = orig_row.get('timeStamp')
                if pd.notnull(timestamp):
                    if isinstance(timestamp, pd.Timestamp):
                        timestamp = timestamp.isoformat()
                    else:
                        timestamp = str(timestamp)
                else:
                    timestamp = 'N/A'
                
                result = {
                    'transaction_hash': orig_row.get('hash', 'N/A'),
                    'is_anomaly': is_anomaly,
                    'anomaly_types': anomaly_types,
                    'transaction_details': {
                        'value': float(row['value']),
                        'gas': float(row['gas']),
                        'gasPrice': float(row['gasPrice']),
                        'timestamp': timestamp
                    }
                }
                results.append(result)
            
            # Add results to DataFrame (create a copy to avoid modifying view)
            result_df = self.df.copy()
            result_df['anomaly_result'] = results
            
            num_anomalies = len([r for r in results if r['is_anomaly']])
            logger.info(f"Detected {num_anomalies} anomalous transactions out of {len(results)} total.")
            return result_df
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            raise

    def save_model(self, path=None):
        """
        Save the trained model and its components.

        :param path: Directory path to save the model files
        """
        try:
            # If path is not provided, use the default relative path
            if path is None:
                # Find the project root directory (looks for models directory)
                current_dir = Path.cwd()
                model_dir = current_dir / 'models'
                
                # If models directory doesn't exist at current level, go up one level
                if not model_dir.exists():
                    parent_dir = current_dir.parent
                    model_dir = parent_dir / 'models'
                
                # If still not found, create in current directory
                if not model_dir.exists():
                    model_dir = current_dir / 'models'
                    
                path = str(model_dir)
            
            # Create directory if it doesn't exist
            os.makedirs(path, exist_ok=True)
            
            # Ensure model is trained before saving
            if not hasattr(self.model, 'offset_'):
                logger.warning("Model not yet trained. Cannot save untrained model.")
                return False
                
            joblib.dump(self.model, os.path.join(path, 'isolation_forest.joblib'))
            joblib.dump(self.scaler, os.path.join(path, 'scaler.joblib'))
            joblib.dump(self.thresholds, os.path.join(path, 'thresholds.joblib'))
            logger.info(f"Model and components saved to {path}/")
            return True
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            return False

    @classmethod
    def load_model(cls, path=None):
        """
        Load a trained model and its components.

        :param path: Directory path containing the model files
        :return: Initialized AnomalyDetectorIsolationForest instance
        """
        try:
            # If path is not provided, use the default relative path
            if path is None:
                # Find the project root directory (looks for models directory)
                current_dir = Path.cwd()
                model_dir = current_dir / 'models'
                
                # If models directory doesn't exist at current level, go up one level
                if not model_dir.exists():
                    parent_dir = current_dir.parent
                    model_dir = parent_dir / 'models'
                
                path = str(model_dir)
            
            # Check if model files exist
            model_path = os.path.join(path, 'isolation_forest.joblib')
            scaler_path = os.path.join(path, 'scaler.joblib')
            thresholds_path = os.path.join(path, 'thresholds.joblib')
            
            if not all(os.path.exists(p) for p in [model_path, scaler_path, thresholds_path]):
                logger.error(f"Missing model files in {path}")
                raise FileNotFoundError(f"Model files not found in {path}")
            
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            thresholds = joblib.load(thresholds_path)
            
            # Create instance without preparing features
            instance = cls(should_prepare=False)
            instance.model = model
            instance.scaler = scaler
            instance.thresholds = thresholds
            
            logger.info("Model and components loaded successfully.")
            return instance
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
