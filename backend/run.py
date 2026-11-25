"""Sayt REST API ni lokal ishga tushirish.

Lokalda port 8001: 8000-portni ildizdagi ovozli backend (uvicorn app.main:app)
egallaydi, ikkalasi bir vaqtda ishlaydi.
"""

import os

import uvicorn

PORT = int(os.getenv("PORT", "8001"))

if __name__ == "__main__":
    print("VOXY sayt REST API ishga tushmoqda...")
    print(f"Swagger: http://localhost:{PORT}/docs")
    print(f"Redoc:   http://localhost:{PORT}/redoc")
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
