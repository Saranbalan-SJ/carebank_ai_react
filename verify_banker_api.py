
import requests

API_URL = "http://localhost:8000"

def test_banker_flow():
    print("Testing Banker Login...")
    login_data = {
        "username": "admin_manager",
        "password": "password123"
    }
    
    try:
        # Use form data as expected by OAuth2PasswordRequestForm
        response = requests.post(f"{API_URL}/api/login", data=login_data)
        response.raise_for_status()
        token = response.json()["access_token"]
        role = response.json()["role"]
        print(f"Login successful! Role: {role}")
        
        print("Testing Admin Dashboard Data...")
        headers = {"Authorization": f"Bearer {token}"}
        dashboard_res = requests.get(f"{API_URL}/api/admin/customers", headers=headers)
        dashboard_res.raise_for_status()
        print(f"Dashboard data fetched successfully! Customers found: {len(dashboard_res.json())}")
        
    except Exception as e:
        print(f"Test failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")

if __name__ == "__main__":
    test_banker_flow()
