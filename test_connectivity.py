#!/usr/bin/env python3
"""
Simple connectivity test
"""
import requests

def test_connectivity():
    """Test basic connectivity to the backend"""
    print("Testing basic connectivity to backend...")
    
    try:
        # Test the docs endpoint
        response = requests.get('http://localhost:8000/docs', timeout=10)
        print(f"Docs endpoint: {response.status_code}")
        
        # Test a simple custom endpoint if it exists
        try:
            response = requests.get('http://localhost:8000/health', timeout=10)
            print(f"Health endpoint: {response.status_code}")
            print(f"Health response: {response.text[:200]}")
        except:
            print("Health endpoint not available")
        
        # Test that the server is responding
        response = requests.get('http://localhost:8000/', timeout=10)
        print(f"Root endpoint: {response.status_code}")
        
        return True
    except requests.exceptions.ConnectionError:
        print("Cannot connect to backend server")
        return False
    except requests.exceptions.Timeout:
        print("Request timed out")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    test_connectivity()