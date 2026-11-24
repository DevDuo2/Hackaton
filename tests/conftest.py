import os

# Tests must be deterministic and must never read the developer's real .env (it holds secrets).
# Set before any `app` import, because app.main builds the app at import time.
os.environ["VOXY_DISABLE_DOTENV"] = "1"
