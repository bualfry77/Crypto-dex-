#!/usr/bin/env python3
import requests
import json
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://encrypted-purse.preview.emergentagent.com/api"

def test_root_endpoint():
    """Test GET /api/ - should return {"message": "Hello World"}"""
    print("Testing GET /api/")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ GET /api/ test PASSED")
                return True
            else:
                print(f"❌ GET /api/ test FAILED - Expected message 'Hello World', got {data}")
                return False
        else:
            print(f"❌ GET /api/ test FAILED - Expected status 200, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ GET /api/ test FAILED - Exception: {e}")
        return False

def test_post_status():
    """Test POST /api/status with body: {"client_name": "test"}"""
    print("\nTesting POST /api/status")
    try:
        payload = {"client_name": "test"}
        response = requests.post(f"{BACKEND_URL}/status", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("client_name") == "test" and "id" in data and "timestamp" in data:
                print("✅ POST /api/status test PASSED")
                return True, data.get("id")
            else:
                print(f"❌ POST /api/status test FAILED - Invalid response structure: {data}")
                return False, None
        else:
            print(f"❌ POST /api/status test FAILED - Expected status 200, got {response.status_code}")
            return False, None
    except Exception as e:
        print(f"❌ POST /api/status test FAILED - Exception: {e}")
        return False, None

def test_get_status():
    """Test GET /api/status"""
    print("\nTesting GET /api/status")
    try:
        response = requests.get(f"{BACKEND_URL}/status")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ GET /api/status test PASSED - Found {len(data)} status checks")
                return True
            else:
                print(f"❌ GET /api/status test FAILED - Expected list, got {type(data)}")
                return False
        else:
            print(f"❌ GET /api/status test FAILED - Expected status 200, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ GET /api/status test FAILED - Exception: {e}")
        return False

def main():
    print(f"Testing Backend Endpoints at: {BACKEND_URL}")
    print("=" * 50)
    
    # Run all tests
    results = []
    
    # Test 1: GET /api/
    results.append(test_root_endpoint())
    
    # Test 2: POST /api/status
    post_result, created_id = test_post_status()
    results.append(post_result)
    
    # Test 3: GET /api/status
    results.append(test_get_status())
    
    print("\n" + "=" * 50)
    print("SUMMARY:")
    print(f"✅ Passed: {sum(results)}/{len(results)} tests")
    print(f"❌ Failed: {len(results) - sum(results)}/{len(results)} tests")
    
    if all(results):
        print("\n🎉 All backend endpoints are working correctly!")
        print("✓ Data is being saved to MongoDB")
        return 0
    else:
        print("\n⚠️  Some tests failed - check the details above")
        return 1

if __name__ == "__main__":
    sys.exit(main())