import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import PREVIEW_ORIGIN_REGEX, settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.core.security import check_jwt_secret
from app.core.seeder import seed_initial_data
from app.routers import (
    admin,
    ai_tutor,
    auth,
    billing,
    courses,
    quizzes,
    subjects,
    telegram,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: MongoDB ga ulanish va seeder
    await connect_to_mongo()
    await seed_initial_data()
    yield
    # Shutdown: Ulanishni yopish
    await close_mongo_connection()


# Production'da standart JWT kaliti bilan ishga tushishni to'xtatadi (import vaqtida).
check_jwt_secret()

app = FastAPI(
    title="VOXY — AI Learning Platform REST API",
    description="Ko'p tarmoqli AI ta'lim platformasi uchun to'liq backend API xizmati (MongoDB + FastAPI + Swagger).",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS: aniq ro'yxat + Render/Vercel preview manzillari uchun regex.
# `allow_origins=["*"]` ataylab qo'llanmaydi — allow_credentials=True bilan
# brauzerlar uni rad etadi va hech qanday himoya bermaydi.
logger.info("CORS origins: %s (+regex %s)", settings.cors_origins, settings.cors_origin_regex)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Routerlar
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(courses.router)
app.include_router(ai_tutor.router)
app.include_router(quizzes.router)
app.include_router(telegram.router)
app.include_router(admin.router)
app.include_router(billing.router)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "service": "VOXY AI Backend API",
        "version": app.version,
        "environment": settings.APP_ENV,
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health Check"])
async def health():
    """Monitoring uchun: baza haqiqatan ulanganini ham ko'rsatadi."""
    from app.core.database import get_database

    db = get_database()
    connected = False
    if db is not None:
        try:
            await db.client.admin.command("ping")
            connected = True
        except Exception:
            connected = False
    return {
        "status": "ok",
        "database": "connected" if connected else "fallback_memory",
        "environment": settings.APP_ENV,
    }
