import os
import json
import time
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# --- ENV ---
KV_URL = os.environ.get("KV_REST_API_URL", "").rstrip("/")
KV_TOKEN = os.environ.get("KV_REST_API_TOKEN", "")
TRACKER_TOKEN = os.environ.get("TRACKER_AUTH_TOKEN", "")  # set this in Vercel env
LATEST_KEY = os.environ.get("LATEST_KEY", "latest")
HISTORY_PREFIX = os.environ.get("HISTORY_PREFIX", "found:")

# --- Upstash helpers (no 'requests' needed) ---
def _kv_headers(content_type=None):
    h = {"Authorization": f"Bearer {KV_TOKEN}"}
    if content_type:
        h["Content-Type"] = content_type
    return h

def kv_get(key: str):
    if not KV_URL or not KV_TOKEN:
        raise RuntimeError("KV_REST_API_URL / KV_REST_API_TOKEN not configured")
    req = Request(f"{KV_URL}/get/{key}", headers=_kv_headers())
    with urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("result")

def kv_set(key: str, value):
    if not KV_URL or not KV_TOKEN:
        raise RuntimeError("KV_REST_API_URL / KV_REST_API_TOKEN not configured")
    # Upstash KV stores raw strings; we store a JSON string
    raw = json.dumps(value)
    body = raw.encode("utf-8")
    req = Request(
        f"{KV_URL}/set/{key}",
        data=body,
        method="POST",
        headers=_kv_headers("text/plain"),
    )
    with urlopen(req, timeout=10) as resp:
        # Typical: {"result":"OK"}
        return json.loads(resp.read().decode("utf-8"))

# --- HTTP handler required by Vercel Python runtime ---
class handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Tracker-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _send_json(self, status: int, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    # GET  -> returns {"items":[{"code":"...", "item":"...", "cosmetics":[...]}]}
    def do_GET(self):
        try:
            latest = kv_get(LATEST_KEY)
            if latest:
                # latest is a JSON string we saved earlier
                try:
                    obj = json.loads(latest) if isinstance(latest, str) else latest
                except json.JSONDecodeError:
                    obj = {"code": "", "item": str(latest), "cosmetics": []}
                # Unity code expects "items": [{code, item, (optional) cosmetics}]
                payload = {
                    "items": [{
                        "code": obj.get("code", ""),
                        "item": obj.get("item", ""),
                        "cosmetics": obj.get("cosmetics", [])
                    }]
                }
            else:
                payload = {"items": []}
            self._send_json(200, payload)
        except (HTTPError, URLError) as e:
            self._send_json(502, {"error": f"KV error: {getattr(e, 'reason', str(e))}"})
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    # POST -> body: {"code":"MBEACHY","region":"US","item":"Stick","cosmetics":["Stick"]}
    # Saves to Upstash KV and returns {"ok": true}
    def do_POST(self):
        try:
            # optional auth so only your tracker can POST
            if TRACKER_TOKEN:
                supplied = self.headers.get("X-Tracker-Token")
                if not supplied:
                    # allow token in JSON too as a fallback
                    length = int(self.headers.get("Content-Length", "0") or "0")
                    raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
                    try:
                        tmp = json.loads(raw or "{}")
                    except json.JSONDecodeError:
                        tmp = {}
                    supplied = tmp.get("token")
                    # reset stream consumption
                    raw_json = tmp
                else:
                    raw_json = None

                if supplied != TRACKER_TOKEN:
                    self._send_json(401, {"error": "unauthorized"})
                    return
            else:
                raw_json = None

            if raw_json is None:
                length = int(self.headers.get("Content-Length", "0") or "0")
                raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
                raw_json = json.loads(raw or "{}")

            code = (raw_json.get("code") or "").strip()
            region = (raw_json.get("region") or "").strip()
            item = (raw_json.get("item") or raw_json.get("cosmetic") or "").strip()
            cosmetics = raw_json.get("cosmetics") or ([item] if item else [])

            if region and not code.endswith(region):
                code = f"{code}{region}"

            record = {"code": code, "item": item, "cosmetics": cosmetics}

            # set latest + append a history entry
            kv_set(LATEST_KEY, record)
            kv_set(f"{HISTORY_PREFIX}{int(time.time())}:{code}", record)

            self._send_json(200, {"ok": True})
        except json.JSONDecodeError:
            self._send_json(400, {"error": "invalid JSON"})
        except (HTTPError, URLError) as e:
            self._send_json(502, {"error": f"KV error: {getattr(e, 'reason', str(e))}"})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
