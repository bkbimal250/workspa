"""
SEO API routes
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.seo import sitemap, robots
from app.modules.jobs.models import Job, JobCategory
from app.modules.locations.models import City, Area
from app.modules.spas.models import Spa

router = APIRouter(prefix="/api/seo", tags=["seo"])


@router.get("/sitemap.xml")
def get_sitemap(db: Session = Depends(get_db)):
    """Generate and return XML sitemap"""
    sitemap_xml = sitemap.generate_sitemap(db)
    return Response(
        content=sitemap_xml,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600, s-maxage=3600"
        }
    )


@router.get("/robots.txt")
def get_robots_txt():
    """Generate and return robots.txt"""
    robots_txt = robots.generate_robots_txt()
    return Response(
        content=robots_txt,
        media_type="text/plain",
        headers={
            "Cache-Control": "public, max-age=86400"
        }
    )


@router.get("/sitemap-data")
def get_sitemap_data(db: Session = Depends(get_db)):
    """Return compact public records used by the frontend sitemap generator."""
    jobs = (
        db.query(Job.slug, Job.updated_at, Job.created_at)
        .filter(Job.is_active == True, Job.slug.isnot(None))
        .order_by(Job.updated_at.desc())
        .limit(5000)
        .all()
    )
    spas = (
        db.query(Spa.slug, Spa.updated_at, Spa.created_at)
        .filter(Spa.is_active == True, Spa.slug.isnot(None))
        .order_by(Spa.updated_at.desc())
        .limit(2000)
        .all()
    )
    cities = (
        db.query(City.id, City.name, City.slug)
        .filter(City.slug.isnot(None))
        .limit(1000)
        .all()
    )
    areas = (
        db.query(Area.id, Area.name, Area.slug, Area.city_id)
        .filter(Area.slug.isnot(None))
        .limit(5000)
        .all()
    )
    categories = (
        db.query(JobCategory.name, JobCategory.slug)
        .filter(JobCategory.slug.isnot(None))
        .limit(500)
        .all()
    )

    return {
        "jobs": [
            {"slug": slug, "updated_at": updated_at, "created_at": created_at}
            for slug, updated_at, created_at in jobs
        ],
        "spas": [
            {"slug": slug, "updated_at": updated_at, "created_at": created_at}
            for slug, updated_at, created_at in spas
        ],
        "cities": [
            {"id": id, "name": name, "slug": slug}
            for id, name, slug in cities
        ],
        "areas": [
            {"id": id, "name": name, "slug": slug, "city_id": city_id}
            for id, name, slug, city_id in areas
        ],
        "categories": [
            {"name": name, "slug": slug}
            for name, slug in categories
        ],
    }

