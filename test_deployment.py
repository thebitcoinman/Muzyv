#!/usr/bin/env python3
"""
Test script to verify the rendering functionality
"""
import requests
import json
from pathlib import Path

# Test backend connectivity
def test_backend():
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"✅ Backend health check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_status_endpoint():
    try:
        response = requests.get("http://localhost:8000/status")
        print(f"✅ Status endpoint: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Status endpoint failed: {e}")
        return False

def test_frontend():
    try:
        response = requests.get("http://localhost:5173/")
        print(f"✅ Frontend accessible: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Muzyv Web App Deployment")
    print("=" * 50)
    
    backend_ok = test_backend()
    status_ok = test_status_endpoint()
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 50)
    if backend_ok and status_ok and frontend_ok:
        print("✅ All services are running correctly!")
        print("\n📱 Access the webapp at: http://localhost:5173/")
        print("🔧 Backend API at: http://localhost:8000/")
        print("📊 Backend status: http://localhost:8000/status")
    else:
        print("❌ Some services are not working properly")
        if not backend_ok:
            print("  - Backend is not responding")
        if not status_ok:
            print("  - Status endpoint is not working")
        if not frontend_ok:
            print("  - Frontend is not accessible")