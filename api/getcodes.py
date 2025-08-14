import os
import json
import requests

def handler(request):
    try:
        # Get environment variables safely
        KV_REST_API_URL = os.environ.get("KV_REST_API_URL")
        KV_REST_API_TOKEN = os.environ.get("KV_REST_API_TOKEN")

        if not KV_REST_API_URL or not KV_REST_API_TOKEN:
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "error": "Missing KV_REST_API_URL or KV_REST_API_TOKEN in environment variables."
                })
            }

        # Get all keys from KV
        r = requests.get(
            f"{KV_REST_API_URL}/keys",
            headers={"Authorization": f"Bearer {KV_REST_API_TOKEN}"}
        )

        # Check if request failed
        if r.status_code != 200:
            return {
                "statusCode": r.status_code,
                "body": json.dumps({
                    "error": "Failed to fetch keys from KV",
                    "details": r.text
                })
            }

        keys = r.json()
        if not keys:
            return {
                "statusCode": 200,
                "body": json.dumps({"items": []})
            }

        # Get the latest key
        latest_key = keys[-1]

        value_resp = requests.get(
            f"{KV_REST_API_URL}/get/{latest_key}",
            headers={"Authorization": f"Bearer {KV_REST_API_TOKEN}"}
        )

        if value_resp.status_code != 200:
            return {
                "statusCode": value_resp.status_code,
                "body": json.dumps({
                    "error": f"Failed to fetch value for key {latest_key}",
                    "details": value_resp.text
                })
            }

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
