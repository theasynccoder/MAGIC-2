import requests

url = "http://localhost:8001/chat"
payload = {"query": "What is a brain tumor?", "conversation_history": []}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Error:", e)
