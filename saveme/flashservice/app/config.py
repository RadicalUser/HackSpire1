"""
Configuration settings for the Flask API.
"""

import os

# Flask settings
DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
HOST = os.environ.get('FLASK_HOST', '0.0.0.0')
PORT = int(os.environ.get('FLASK_PORT', 5000))

# API settings
API_VERSION = 'v1'
API_PREFIX = f'/api/{API_VERSION}'

# Model settings
MODEL_PATH = os.environ.get('MODEL_PATH', '../model/models')