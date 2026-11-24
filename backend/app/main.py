from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.seeder import seed_initial_data

from app.routers import (
    auth,
    subjects,
    courses,
    ai_tutor,
    quizzes,
    telegram,
    admin
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: MongoDB ga ulanish va seeder
    await connect_to_mongo()
    await seed_initial_data()
    yield
    # Shutdown: Ulanishni yopish
    await close_mongo_connection()

app = FastAPI(
    title="VOXY — AI Learning Platform REST API",
    description="Ko'p tarmoqli AI ta'lim platformasi uchun to'liq backend API xizmati (MongoDB + FastAPI + Swagger).",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS sozlamalari (Next.js frontend va Render / Vercel uchun ruxsat)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerlar
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(courses.router)
app.include_router(ai_tutor.router)
app.include_router(quizzes.router)
app.include_router(telegram.router)
app.include_router(admin.router)

@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "service": "VOXY AI Backend API",
        "database": "MongoDB Connected",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "100% Operational"
    }
