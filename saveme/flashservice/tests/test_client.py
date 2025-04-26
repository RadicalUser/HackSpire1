#!/usr/bin/env python
"""
Test client for the Anomaly Detection Service API.

This script demonstrates how to interact with the RESTful API by sending
sample transaction data and displaying the anomaly detection results.
"""

import requests
import json
import sys
import os
from pprint import pprint

# Default API URL (can be overridden via environment variable)
API_URL = os.environ.get('API_URL', 'http://localhost:5000')

def test_health_check():
    """Test the health check endpoint"""
    url = f"{API_URL}/health"
    print(f"\n🔍 Testing health check endpoint: {url}")
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise exception for non-200 responses
        print("✅ Health check successful:")
        pprint(response.json())
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {str(e)}")
        return False

def test_detect_anomalies(transaction_file=None):
    """Test the anomaly detection endpoint with sample transactions"""
    url = f"{API_URL}/api/v1/detect"
    print(f"\n🔍 Testing anomaly detection endpoint: {url}")
    
    # Load transactions from file if provided, otherwise use sample data
    if transaction_file and os.path.exists(transaction_file):
        try:
            with open(transaction_file, 'r') as f:
                data = json.load(f)
            print(f"📄 Loaded transactions from {transaction_file}")
        except Exception as e:
            print(f"❌ Failed to load transactions file: {str(e)}")
            return False
    else:
        # Use sample transaction data
        data = {
            "transactions": [
                {
                    "hash": "0x123abc...",
                    "timeStamp": "1678901234",
                    "value": "1000000000000000000",
                    "gas": "21000",
                    "gasPrice": "50000000000"
                },
                {
                    "hash": "0x456def...",
                    "timeStamp": "1678901235", 
                    "value": "100000000000000000000",
                    "gas": "150000",
                    "gasPrice": "100000000000"
                }
            ]
        }
        print("📄 Using sample transaction data")
    
    try:
        # Print request payload for debugging
        print("\nRequest payload:")
        pprint(data)
        
        # Make the POST request to the API
        response = requests.post(url, json=data)
        response.raise_for_status()  # Raise exception for non-200 responses
        
        # Print the response
        print("\n✅ Anomaly detection successful:")
        results = response.json()
        pprint(results)
        
        # Save results to file
        output_file = "results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n💾 Results saved to {output_file}")
        
        return True
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Anomaly detection request failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print("Error details:")
                pprint(error_data)
            except:
                print(f"Status code: {e.response.status_code}")
                print(f"Response text: {e.response.text}")
        return False

def test_batch_detect_anomalies():
    """Test the batch anomaly detection endpoint with sample batches"""
    url = f"{API_URL}/api/v1/batch-detect"
    print(f"\n🔍 Testing batch anomaly detection endpoint: {url}")
    
    # Sample batch data
    data = {
        "batches": [
            {
                "batch_id": "batch1",
                "transactions": [
                    {
                        "hash": "0x123abc...",
                        "timeStamp": "1678901234",
                        "value": "1000000000000000000",
                        "gas": "21000",
                        "gasPrice": "50000000000"
                    }
                ]
            },
            {
                "batch_id": "batch2",
                "transactions": [
                    {
                        "hash": "0x456def...",
                        "timeStamp": "1678901235",
                        "value": "100000000000000000000",
                        "gas": "150000",
                        "gasPrice": "100000000000"
                    }
                ]
            }
        ]
    }
    
    try:
        # Print request payload for debugging
        print("\nRequest payload:")
        pprint(data)
        
        # Make the POST request to the API
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        # Print the response
        print("\n✅ Batch anomaly detection successful:")
        pprint(response.json())
        return True
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Batch anomaly detection request failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print("Error details:")
                pprint(error_data)
            except:
                print(f"Status code: {e.response.status_code}")
                print(f"Response text: {e.response.text}")
        return False

def main():
    """Main function to run all tests"""
    print("=" * 60)
    print("🚀 ANOMALY DETECTION SERVICE API CLIENT".center(60))
    print("=" * 60)
    
    # Parse command line arguments for transaction file
    transaction_file = None
    if len(sys.argv) > 1:
        transaction_file = sys.argv[1]
        if not os.path.exists(transaction_file):
            print(f"❌ Transaction file not found: {transaction_file}")
            sys.exit(1)
    
    # Run tests
    health_ok = test_health_check()
    if not health_ok:
        print("\n❌ Health check failed. API may not be running.")
        print("Make sure the Flask API is running and try again.")
        sys.exit(1)
    
    detect_ok = test_detect_anomalies(transaction_file)
    batch_ok = test_batch_detect_anomalies()
    
    # Print summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY".center(60))
    print("=" * 60)
    print(f"Health Check: {'✅ Passed' if health_ok else '❌ Failed'}")
    print(f"Anomaly Detection: {'✅ Passed' if detect_ok else '❌ Failed'}")
    print(f"Batch Anomaly Detection: {'✅ Passed' if batch_ok else '❌ Failed'}")
    print("=" * 60)

if __name__ == '__main__':
    main()