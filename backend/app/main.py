"""
Main FastAPI application entry point
SPA Job Portal - Backend API
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio

from app.core.database import init_db
from app.core.config import settings

from app.modules.users.routes import router as users_router
from app.modules.locations.routes import router as locations_router
from app.modules.spas.routes import router as spas_router
from app.modules.jobs.routes import router as jobs_router
from app.modules.applications.routes import router as applications_router
from app.modules.messages.routes import router as messages_router
from app.modules.analytics.routes import router as analytics_router
from app.modules.seo.routes import router as seo_router
from app.modules.subscribe.routes import router as subscribe_router
from app.modules.chatbot.routes import router as chatbot_router
from app.modules.contact.routes import router as contact_router
from app.modules.whatsaapLeads.routes import router as whatsaap_leads_router


# -------------------------------------------------
# App Initialization
# -------------------------------------------------
app = FastAPI(
    title="SPA Job Portal API",
    description="Location-intelligent, SEO-first SPA Job Portal Backend",
    version="1.0.0",
    docs_url="/api/docs" if settings.LOG_LEVEL == "DEBUG" else None,
    redoc_url="/api/redoc" if settings.LOG_LEVEL == "DEBUG" else None,
)


# -------------------------------------------------
# Middleware
# -------------------------------------------------

# GZip
app.add_middleware(GZipMiddleware, minimum_size=2000)

# CORS (optimized)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://workspa.in",
        "https://www.workspa.in",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type",],
)



# -------------------------------------------------
# Static Files (Uploads)
# -------------------------------------------------
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "spas"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "profiles"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "cvs"), exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads",
)


# -------------------------------------------------
# Startup Events
# -------------------------------------------------
@app.on_event("startup")
async def startup_event():
    await asyncio.to_thread(init_db)


# -------------------------------------------------
# Routers
# -------------------------------------------------
app.include_router(users_router)
app.include_router(locations_router)
app.include_router(spas_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(messages_router)
app.include_router(analytics_router)
app.include_router(seo_router)
app.include_router(subscribe_router)
app.include_router(chatbot_router)
app.include_router(contact_router)
app.include_router(whatsaap_leads_router)


# -------------------------------------------------
# Health & Root
# -------------------------------------------------
@app.get("/")
async def root():
    return {"message": "SPA Job Portal API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
