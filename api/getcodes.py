import os
import json
import requests

KV_REST_API_URL = os.environ.get("KV_REST_API_URL")
KV_REST_API_TOKEN = os.environ.get("KV_REST_API_TOKEN")

def handler(request):
    try:
        if not KV_REST_API_URL or not KV_REST_API_TOKEN:
            print("❌ Missing KV_REST_API_URL or KV_REST_API_TOKEN")
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "Missing environment variables"})
            }

        # Get all keys
        r = requests.get(
            f"{KV_REST_API_URL}/keys",
            headers={"Authorization": f"Bearer {KV_REST_API_TOKEN}"}
        )
        print("Keys status:", r.status_code, r.text)
        r.raise_for_status()

        keys = r.json()
        if not keys:
            return {
                "statusCode": 200,
                "body": json.dumps({"items": []})
            }

        # Get latest key
        latest_key = keys[-1]
        value_resp = requests.get(
            f"{KV_REST_API_URL}/get/{latest_key}",
            headers={"Authorization": f"Bearer {KV_REST_API_TOKEN}"}
        )
        print("Value status:", value_resp.status_code, value_resp.text)
        value_resp.raise_for_status()

        latest_value = value_resp.json().get("result")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "items": [{"code": latest_key, "item": latest_value}]
            })
        }

    except Exception as e:
        print("❌ Error in getcodes:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
