import os
import json
import requests

KV_REST_API_URL = os.environ["KV_REST_API_URL"]
KV_REST_API_TOKEN = os.environ["KV_REST_API_TOKEN"]

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": json.dumps({"error": "Method not allowed"})
        }
    
    try:
        data = json.loads(request.body.decode())
        code = data.get("code")
        item = data.get("item")
        
        if not code or not item:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing 'code' or 'item'"})
            }

        # Store in KV with the code as key and item as value
        r = requests.put(
            f"{KV_REST_API_URL}/set/{code}",
            headers={"Authorization": f"Bearer {KV_REST_API_TOKEN}"},
            json={"value": item}
        )
        
        return {
            "statusCode": 200,
            "b
