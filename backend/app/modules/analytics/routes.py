"""
Analytics API routes
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.analytics import trackers, reports
from app.modules.analytics.chatbot_reports import get_chatbot_usage
from app.modules.users.models import User, UserRole
from app.modules.users.routes import require_role
from app.utils.ip_location import get_location_from_ip
from app.utils.device_detection import detect_device_type

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/track")
async def track_event(
    request: Request,
    event_type: str,
    job_id: int | None = None,
    spa_id: int | None = None,
    city: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    search_query: str | None = None,
    db: Session = Depends(get_db),
):
    """Track an analytics event"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Auto-detect location from IP if not provided
    if not latitude or not longitude:
        ip_location = get_location_from_ip(client_ip)
        if ip_location:
            latitude = latitude or ip_location.get('latitude')
            longitude = longitude or ip_location.get('longitude')
            city = city or ip_location.get('city')

    trackers.track_event(
        db=db,
        event_type=event_type,
        job_id=job_id,
        spa_id=spa_id,
        city=city,
        latitude=latitude,
        longitude=longitude,
        user_agent=user_agent,
        ip_address=client_ip,
        search_query=search_query
    )

    return {"status": "tracked"}


@router.get("/popular-locations")
def get_popular_locations(
    limit: int = 10,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get most popular locations.

    Optional:
    - days: if provided, only count events within the last `days` days.
    """
    return reports.get_popular_locations(db, limit=limit, days=days)


@router.get("/dashboard-overview")
def get_dashboard_overview(
    days: int | None = None,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db),
):
    """
    Get compact system and analytics totals for the dashboard.

    System totals are all time. Button click totals respect the optional days
    window so they match the selected analytics period.
    """
    return reports.get_dashboard_overview(db, days=days)


@router.get("/chatbot-usage")
def get_chatbot_usage_stats(db: Session = Depends(get_db)):
    """
    Get chatbot usage counts (unique users) for:
    - daily
    - weekly
    - monthly
    - yearly
    - total (all time)
    """
    return get_chatbot_usage(db)


@router.get("/time-series")
def get_time_series(
    days: int = 30,
    db: Session = Depends(get_db),
):
    """
    Get total analytics events per day for the last `days` days.
    Used for time-based analytics charts.
    """
    return reports.get_event_counts_by_day(db, days=days)


@router.get("/event-counts")
def get_event_counts(
    days: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get total event counts by event type (page_view, apply_click, etc.).
    If `days` is provided, only count events within that time window.
    Returns: {"page_view": int, "apply_click": int, "cv_upload": int, "chat_opened": int}
    """
    return reports.get_event_counts_by_type(db, days=days)


@router.get("/location-from-ip")
async def get_location_from_ip_endpoint(request: Request):
    """Get location information from client IP address"""
    client_ip = request.client.host if request.client else "unknown"
    location = get_location_from_ip(client_ip)
    
    if location:
        return {
            "success": True,
            "location": location
        }
    return {
        "success": False,
        "message": "Could not determine location from IP"
    }


@router.get("/top-job-searches")
def get_top_job_searches(
    limit: int = 10,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get top job search queries.
    Optional: days - if provided, only count searches within the last `days` days.
    """
    return reports.get_top_job_searches(db, limit=limit, days=days)


@router.get("/unique-visitors")
def get_unique_visitors(
    days: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get count of unique visitors (by IP hash).
    Optional: days - if provided, only count visitors within the last `days` days.
    """
    return {"unique_visitors": reports.get_unique_visitors(db, days=days)}


@router.get("/device-breakdown")
def get_device_breakdown(
    days: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get event counts by device type (mobile, desktop, tablet).
    Optional: days - if provided, only count events within the last `days` days.
    """
    return reports.get_device_type_breakdown(db, days=days)


@router.get("/booking-clicks")
def get_booking_clicks(
    days: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get total booking/appointment button clicks.
    Optional: days - if provided, only count clicks within the last `days` days.
    """
    return {"booking_clicks": reports.get_booking_click_count(db, days=days)}


@router.post("/track-button-click")
async def track_button_click(
    request: Request,
    button_type: str,  # 'whatsapp', 'call', 'share', 'apply'
    job_id: int,
    user_id: int | None = None,
    city: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    share_platform: str | None = None,  # For share button
    db: Session = Depends(get_db),
):
    """
    Track a button click (WhatsApp, Call, Share, or Apply).
    
    Frontend should call this when user clicks any of these buttons.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Auto-detect location from IP if not provided
    if not latitude or not longitude:
        ip_location = get_location_from_ip(client_ip)
        if ip_location:
            latitude = latitude or ip_location.get('latitude')
            longitude = longitude or ip_location.get('longitude')
            city = city or ip_location.get('city')
    
    from app.modules.analytics import trackers
    trackers.track_button_click(
        db=db,
        button_type=button_type,
        job_id=job_id,
        user_id=user_id,
        city=city,
        latitude=latitude,
        longitude=longitude,
        user_agent=user_agent,
        ip_address=client_ip,
        share_platform=share_platform
    )
    
    return {"status": "tracked"}


@router.get("/button-clicks")
def get_button_clicks(
    job_id: int | None = None,
    button_type: str | None = None,  # 'whatsapp', 'call', 'share', 'apply'
    days: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get button click counts.
    
    Optional parameters:
    - job_id: Filter by specific job
    - button_type: Filter by button type ('whatsapp', 'call', 'share', 'apply')
    - days: Only count clicks within the last `days` days
    
    Returns counts grouped by button type and optionally by job.
    """
    return reports.get_button_click_counts(db, job_id=job_id, button_type=button_type, days=days)


@router.get("/button-clicks-by-day")
def get_button_clicks_by_day(
    button_type: str | None = None,
    days: int = 30,
    db: Session = Depends(get_db),
):
    """
    Get button click counts per day.
    
    Optional:
    - button_type: Filter by button type
    - days: Number of days to look back (default 30)
    
    Returns: [{"date": "YYYY-MM-DD", "count": int, "button_type": str}, ...]
    """
    return reports.get_button_clicks_by_day(db, button_type=button_type, days=days)

