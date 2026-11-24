import uvicorn

if __name__ == "__main__":
    print("🚀 VOXY AI Backend Server ishga tushmoqda...")
    print("📖 Swagger API Hujjatlari: http://localhost:8000/docs")
    print("📖 Redoc API Hujjatlari: http://localhost:8000/redoc")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
