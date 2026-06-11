"""
Analytics reporting and insights
"""

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.analytics.models import AnalyticsEvent, JobButtonClickAnalytics


def _since(days: int | None) -> datetime | None:
    if days is not None and days > 0:
        return datetime.utcnow() - timedelta(days=days)
    return None


def get_popular_locations(db: Session, limit: int = 10, days: int | None = None):
    """
    Get most popular locations by event count.

    If `days` is provided, only events within that time window are counted.
    Returns a list of dicts: [{"city": str, "event_count": int}, ...]
    """
    query = db.query(
        AnalyticsEvent.city,
        func.count(AnalyticsEvent.id).label("event_count"),
    )

    if days is not None and days > 0:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AnalyticsEvent.created_at >= since)

    results = (
        query.group_by(AnalyticsEvent.city)
        .order_by(func.count(AnalyticsEvent.id).desc())
        .limit(limit)
        .all()
    )

    # Convert SQLAlchemy Row objects to dictionaries
    return [
        {"city": row.city, "event_count": row.event_count}
        for row in results
        if row.city  # Filter out None cities
    ]


def get_job_impressions(db: Session, job_id: int):
    """Get total impressions for a job"""
    return (
        db.query(AnalyticsEvent)
        .filter(
            AnalyticsEvent.job_id == job_id,
            AnalyticsEvent.event_type == "page_view",
        )
        .count()
    )


def get_event_counts_by_day(db: Session, days: int = 30):
    """
    Get total analytics events per day for the last `days` days.
    Returns a list of dicts: [{ 'date': 'YYYY-MM-DD', 'event_count': int }, ...]
    """
    now = datetime.utcnow()
    since = now - timedelta(days=days)

    # Group by date (without time)
    rows = (
        db.query(
            func.date(AnalyticsEvent.created_at).label("event_date"),
            func.count(AnalyticsEvent.id).label("event_count"),
        )
        .filter(AnalyticsEvent.created_at >= since)
        .group_by(func.date(AnalyticsEvent.created_at))
        .order_by(func.date(AnalyticsEvent.created_at))
        .all()
    )

    return [
        {"date": str(row.event_date), "event_count": row.event_count} for row in rows
    ]


def get_event_counts_by_type(db: Session, days: int | None = None):
    """
    Get total event counts by event type.
    If `days` is provided, only count events within that time window.
    Returns a dict: {"page_view": int, "apply_click": int, ...}
    """
    query = db.query(
        AnalyticsEvent.event_type,
        func.count(AnalyticsEvent.id).label("event_count"),
    )
    
    if days is not None and days > 0:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AnalyticsEvent.created_at >= since)
    
    results = query.group_by(AnalyticsEvent.event_type).all()
    
    # Convert to dictionary
    counts = {row.event_type: row.event_count for row in results}
    
    # Return with default values for common event types
    return {
        "page_view": counts.get("page_view", 0),
        "apply_click": counts.get("apply_click", 0),
        "cv_upload": counts.get("cv_upload", 0),
        "chat_opened": counts.get("chat_opened", 0),
        "job_search": counts.get("job_search", 0),
        "spa_booking_click": counts.get("spa_booking_click", 0),
    }


def get_top_job_searches(db: Session, limit: int = 10, days: int | None = None):
    """
    Get top job search queries.
    Returns a list of dicts: [{"search_query": str, "count": int}, ...]
    """
    query = db.query(
        AnalyticsEvent.search_query,
        func.count(AnalyticsEvent.id).label("count"),
    ).filter(
        AnalyticsEvent.event_type == "job_search",
        AnalyticsEvent.search_query.isnot(None),
        AnalyticsEvent.search_query != ""
    )
    
    if days is not None and days > 0:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AnalyticsEvent.created_at >= since)
    
    results = (
        query.group_by(AnalyticsEvent.search_query)
        .order_by(func.count(AnalyticsEvent.id).desc())
        .limit(limit)
        .all()
    )
    
    return [
        {"search_query": row.search_query, "count": row.count}
        for row in results
    ]


def get_unique_visitors(db: Session, days: int | None = None):
    """
    Get count of unique visitors (by IP hash).
    If `days` is provided, only count visitors within that time window.
    Returns: int
    """
    query = db.query(func.count(func.distinct(AnalyticsEvent.ip_hash)))
    
    if days is not None and days > 0:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AnalyticsEvent.created_at >= since)
    
    # Filter out None IP hashes
    query = query.filter(AnalyticsEvent.ip_hash.isnot(None))
    
    return query.scalar() or 0


def get_device_type_breakdown(db: Session, days: int | None = None):
    """
    Get event counts by device type.
    Returns a dict: {"mobile": int, "desktop": int, "tablet": int}
    """
    query = db.query(
        AnalyticsEvent.device_type,
        func.count(AnalyticsEvent.id).label("count"),
    ).filter(AnalyticsEvent.device_type.isnot(None))
    
    if days is not None and days > 0:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AnalyticsEvent.created_at >= since)
    
    results = query.group_by(AnalyticsEvent.device_type).all()
    
    counts = {row.device_type: row.count for row in results}
    
    return {
        "mobile": counts.get("mobile", 0),
        "desktop": counts.get("desktop", 0),
        "tablet": counts.get("tablet", 0),
    }


def get_booking_click_count(db: Session, days: int | None = None):
    """
    Get total booking/appointment button clicks.
    Returns: int
    """
    query = db.query(func.count(AnalyticsEvent.id)).filter(
        AnalyticsEvent.event_type == "spa_booking_click"
    )
    
    if days is not None and days > 0:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AnalyticsEvent.created_at >= since)
    
    return query.scalar() or 0


def get_button_click_counts(
    db: Session,
    job_id: int | None = None,
    button_type: str | None = None,
    days: int | None = None
):
    """
    Get button click counts grouped by button type and optionally by job.
    
    Returns:
    - If job_id is provided: {"whatsapp": int, "call": int, "share": int, "apply": int}
    - If job_id is None: [{"job_id": int, "button_type": str, "count": int}, ...]
    """
    query = db.query(
        JobButtonClickAnalytics.button_type,
        func.count(JobButtonClickAnalytics.id).label("count")
    )
    
    if job_id:
        query = query.filter(JobButtonClickAnalytics.job_id == job_id)
    
    if button_type:
        query = query.filter(JobButtonClickAnalytics.button_type == button_type)
    
    if days is not None and days > 0:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(JobButtonClickAnalytics.created_at >= since)
    
    if job_id:
        # Return counts by button type for a specific job
        results = query.group_by(JobButtonClickAnalytics.button_type).all()
        counts = {row.button_type: row.count for row in results}
        return {
            "whatsapp": counts.get("whatsapp", 0),
            "call": counts.get("call", 0),
            "share": counts.get("share", 0),
            "apply": counts.get("apply", 0),
        }
    else:
        # Return counts grouped by job_id and button_type
        query = query.add_columns(JobButtonClickAnalytics.job_id)
        results = query.group_by(
            JobButtonClickAnalytics.job_id,
            JobButtonClickAnalytics.button_type
        ).order_by(func.count(JobButtonClickAnalytics.id).desc()).all()
        
        return [
            {
                "job_id": row.job_id,
                "button_type": row.button_type,
                "count": row.count
            }
            for row in results
        ]


def get_button_clicks_by_day(
    db: Session,
    button_type: str | None = None,
    days: int = 30
):
    """
    Get button click counts per day.
    
    Returns: [{"date": "YYYY-MM-DD", "count": int, "button_type": str}, ...]
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(
        func.date(JobButtonClickAnalytics.created_at).label("click_date"),
        JobButtonClickAnalytics.button_type,
        func.count(JobButtonClickAnalytics.id).label("count")
    ).filter(
        JobButtonClickAnalytics.created_at >= since
    )
    
    if button_type:
        query = query.filter(JobButtonClickAnalytics.button_type == button_type)
    
    results = query.group_by(
        func.date(JobButtonClickAnalytics.created_at),
        JobButtonClickAnalytics.button_type
    ).order_by(
        func.date(JobButtonClickAnalytics.created_at),
        JobButtonClickAnalytics.button_type
    ).all()
    
    return [
        {
            "date": str(row.click_date),
            "button_type": row.button_type,
            "count": row.count
        }
        for row in results
    ]


def get_button_click_totals_by_type(db: Session, days: int | None = None):
    """Get total job action clicks grouped by button type."""
    query = db.query(
        JobButtonClickAnalytics.button_type,
        func.count(JobButtonClickAnalytics.id).label("count"),
    )

    since = _since(days)
    if since:
        query = query.filter(JobButtonClickAnalytics.created_at >= since)

    results = query.group_by(JobButtonClickAnalytics.button_type).all()
    counts = {row.button_type: row.count for row in results}

    return {
        "whatsapp": counts.get("whatsapp", 0),
        "call": counts.get("call", 0),
        "share": counts.get("share", 0),
        "apply": counts.get("apply", 0),
    }


def get_dashboard_overview(db: Session, days: int | None = None):
    """
    Compact counts for the analytics dashboard.

    Entity totals are all-time system totals. Analytics click totals respect the
    optional days window, matching the dashboard date filter.
    """
    from app.modules.jobs.models import Job, JobApplication
    from app.modules.spas.models import Spa
    from app.modules.users.models import User

    application_status_rows = (
        db.query(
            JobApplication.status,
            func.count(JobApplication.id).label("count"),
        )
        .group_by(JobApplication.status)
        .all()
    )
    application_status = {
        (row.status or "unknown"): row.count for row in application_status_rows
    }

    button_clicks = get_button_click_totals_by_type(db, days=days)

    return {
        "total_jobs": db.query(func.count(Job.id)).scalar() or 0,
        "active_jobs": db.query(func.count(Job.id))
        .filter(Job.is_active.is_(True))
        .scalar()
        or 0,
        "featured_jobs": db.query(func.count(Job.id))
        .filter(Job.is_featured.is_(True))
        .scalar()
        or 0,
        "total_applications": db.query(func.count(JobApplication.id)).scalar() or 0,
        "application_status": {
            "pending": application_status.get("pending", 0),
            "reviewed": application_status.get("reviewed", 0),
            "accepted": application_status.get("accepted", 0),
            "rejected": application_status.get("rejected", 0),
            "unknown": application_status.get("unknown", 0),
        },
        "total_users": db.query(func.count(User.id)).scalar() or 0,
        "active_users": db.query(func.count(User.id))
        .filter(User.is_active.is_(True))
        .scalar()
        or 0,
        "verified_users": db.query(func.count(User.id))
        .filter(User.is_verified.is_(True))
        .scalar()
        or 0,
        "total_spas": db.query(func.count(Spa.id)).scalar() or 0,
        "active_spas": db.query(func.count(Spa.id))
        .filter(Spa.is_active.is_(True))
        .scalar()
        or 0,
        "verified_spas": db.query(func.count(Spa.id))
        .filter(Spa.is_verified.is_(True))
        .scalar()
        or 0,
        "button_clicks": button_clicks,
        "total_button_clicks": sum(button_clicks.values()),
    }
