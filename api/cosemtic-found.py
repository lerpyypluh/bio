from http.server import BaseHTTPRequestHandler
import os
import json
import sys
import urllib.request

KV_URL = os.environ.get("KV_REST_API_URL")
KV_TOKEN = os.environ.get("KV_REST_API_TOKEN")

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "API is running"}).encode())

    def do_POST(self):
        try:
            # Read incoming JSON
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            cosmetic_name = data.get("cosmetic")
            if not cosmetic_name:
                raise ValueError("Missing 'cosmetic' in request body")

            # Store in Upstash Redis
            if not KV_URL or not KV_TOKEN:
                raise ValueError("KV_REST_API_URL or KV_REST_API_TOKEN not set")

            payload = json.dumps({"cosmetic": cosmetic_name}).encode()
            req = urllib.request.Request(
                f"{KV_URL}/set/{cosmetic_name}",
                data=payload,
                headers={
                    "Authorization": f"Bearer {KV_TOKEN}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )

            with urllib.request.urlopen(req) as resp:
                redis_response = resp.read().decode()

            # Log to Vercel logs
            print(f"Stored cosmetic: {cosmetic_name}", file=sys.stdout)

            # Respond success
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "stored": cosmetic_name,
                "redis_response": redis_response
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
