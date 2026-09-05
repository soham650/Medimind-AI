import requests
import os

API_KEY = os.environ.get("GEMINI_API_KEY", "")
models = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest"
]

for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
    try:
        r = requests.post(url, json={"contents": [{"parts": [{"text": "say hi"}]}]}, timeout=5)
        print(f"Model: {model} -> Status: {r.status_code}")
        print(r.text[:300])
        print("-" * 50)
    except Exception as e:
        print(f"Model: {model} -> Error: {e}")
