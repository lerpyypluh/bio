import os
import json
import requests

KV_REST_API_URL = os.environ["KV_REST_API_URL"]
KV_REST_API_TOKEN = os.environ["KV_REST_API_TOKEN"]

def handler(request):
    try:
        # Get all keys from KV
        r = requests.get(
            f"{KV_REST_API_URL}/keys",
            headers={"Authorization": f"Bearer {KV_REST_API_TOKEN}"}
        )
        keys = r.json()
        
        if not keys:
            return {
                "statusCode": 200,
                "body": json.dumps({"items": []})
            }
        
        # Latest key (last added)
        latest_key = keys[-1]
        
        value_resp = requests.get(
            f"{KV_REST_API_URL}/get/{latest_key}",
            headers={"Authorization": f"Bearer {KV_REST_API_TOKEN}"}
        )
        latest_value = value_resp.json().get("result")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "items": [{"code": latest_key, "item": latest_value}]
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
