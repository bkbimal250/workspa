"""
Job API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List
from app.core.database import get_db
from app.modules.jobs import schemas, services
from app.modules.jobs.models import Job, JobCategory, JobType
from app.modules.locations.models import City, State, Area
from app.modules.users.routes import get_current_user, require_role
from app.modules.users.models import User, UserRole
from app.modules.subscribe.notification_service import send_notifications_for_jobs
from app.modules.subscribe.models import SubscriptionFrequency

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/types")
def get_job_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get all job types.
    Used by frontend for dropdowns and filters.
    """
    job_types = db.query(JobType).offset(skip).limit(limit).all()
    return [
        {
            "id": job_type.id,
            "name": job_type.name,
            "slug": job_type.slug,
            "description": job_type.description,
        }
        for job_type in job_types
    ]


@router.post("/types", response_model=schemas.JobTypeResponse, status_code=status.HTTP_201_CREATED)
def create_job_type(
    job_type: schemas.JobTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new job type.
    
    Only admin and manager can create job types.
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and manager can create job types"
        )
    
    # Check if job type with same name already exists
    existing = db.query(JobType).filter(JobType.name == job_type.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job type with name '{job_type.name}' already exists"
        )
    
    created_type = services.create_job_type(db, job_type)
    return created_type


@router.get("/categories")
def get_job_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get all job categories.
    Used by frontend for dropdowns and filters.
    """
    job_categories = db.query(JobCategory).offset(skip).limit(limit).all()
    return [
        {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
        }
        for category in job_categories
    ]


@router.post("/categories", response_model=schemas.JobCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_job_category(
    job_category: schemas.JobCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new job category.
    
    Only admin and manager can create job categories.
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and manager can create job categories"
        )
    
    # Check if job category with same name already exists
    existing = db.query(JobCategory).filter(JobCategory.name == job_category.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job category with name '{job_category.name}' already exists"
        )
    
    created_category = services.create_job_category(db, job_category)
    return created_category


@router.put("/types/{type_id}", response_model=schemas.JobTypeResponse)
def update_job_type(
    type_id: int,
    job_type_update: schemas.JobTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a job type.
    
    Only admin and manager can update job types.
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and manager can update job types"
        )
    
    # Check if job type exists
    existing = db.query(JobType).filter(JobType.id == type_id).first()
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job type with id {type_id} not found"
        )
    
    # Check for duplicate name if name is being updated
    if job_type_update.name and job_type_update.name != existing.name:
        duplicate = db.query(JobType).filter(JobType.name == job_type_update.name).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job type with name '{job_type_update.name}' already exists"
            )
    
    updated_type = services.update_job_type(db, type_id, job_type_update)
    if not updated_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job type with id {type_id} not found"
        )
    return updated_type


@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a job type (admin only - permanent delete).
    """
    # Check permissions - only admin can delete
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can permanently delete job types"
        )
    
    # Check if job type exists
    existing = db.query(JobType).filter(JobType.id == type_id).first()
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job type with id {type_id} not found"
        )
    
    # Check if any jobs are using this job type
    jobs_count = db.query(Job).filter(Job.job_type_id == type_id).count()
    if jobs_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete job type. {jobs_count} job(s) are using this type."
        )
    
    deleted = services.delete_job_type(db, type_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job type with id {type_id} not found"
        )
    return None


@router.put("/categories/{category_id}", response_model=schemas.JobCategoryResponse)
def update_job_category(
    category_id: int,
    job_category_update: schemas.JobCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a job category.
    
    Only admin and manager can update job categories.
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and manager can update job categories"
        )
    
    # Check if job category exists
    existing = db.query(JobCategory).filter(JobCategory.id == category_id).first()
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job category with id {category_id} not found"
        )
    
    # Check for duplicate name if name is being updated
    if job_category_update.name and job_category_update.name != existing.name:
        duplicate = db.query(JobCategory).filter(JobCategory.name == job_category_update.name).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job category with name '{job_category_update.name}' already exists"
            )
    
    updated_category = services.update_job_category(db, category_id, job_category_update)
    if not updated_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job category with id {category_id} not found"
        )
    return updated_category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a job category (admin only - permanent delete).
    """
    # Check permissions - only admin can delete
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can permanently delete job categories"
        )
    
    # Check if job category exists
    existing = db.query(JobCategory).filter(JobCategory.id == category_id).first()
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job category with id {category_id} not found"
        )
    
    # Check if any jobs are using this job category
    jobs_count = db.query(Job).filter(Job.job_category_id == category_id).count()
    if jobs_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete job category. {jobs_count} job(s) are using this category."
        )
    
    deleted = services.delete_job_category(db, category_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job category with id {category_id} not found"
        )
    return None


@router.get("/", response_model=list[schemas.JobResponse])
def get_jobs(
    skip: int = 0,
    limit: int = 100,
    country_id: int | None = None,
    state_id: int | None = None,
    city_id: int | None = None,
    area_id: int | None = None,
    spa_id: int | None = None,
    job_type: str | None = None,
    job_category: str | None = None,
    is_featured: bool | None = None,
    q: str | None = None,
    location: str | None = None,
    salary_min: int | None = None,
    salary_max: int | None = None,
    experience_years_min: int | None = None,
    experience_years_max: int | None = None,
    sort_by: str = "recent",
    db: Session = Depends(get_db),
):
    """
    Get all active jobs with optional filters.

    Frontend can filter by country, state, city, area, spa, job type,
    job category, and featured flag.
    
    Note: Caching is handled at the service layer for better performance.
    """
    return services.get_jobs(
        db=db,
        skip=skip,
        limit=limit,
        country_id=country_id,
        state_id=state_id,
        city_id=city_id,
        area_id=area_id,
        spa_id=spa_id,
        job_type=job_type,
        job_category=job_category,
        is_featured=is_featured,
        q=q,
        location=location,
        salary_min=salary_min,
        salary_max=salary_max,
        experience_years_min=experience_years_min,
        experience_years_max=experience_years_max,
        sort_by=sort_by,
    )


@router.get("/count")
def get_job_count(
    country_id: int | None = None,
    state_id: int | None = None,
    city_id: int | None = None,
    area_id: int | None = None,
    job_type: str | None = None,
    job_category: str | None = None,
    q: str | None = None,
    location: str | None = None,
    salary_min: int | None = None,
    salary_max: int | None = None,
    experience_years_min: int | None = None,
    experience_years_max: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Get count of active jobs with optional filters.
    Useful for displaying job counts in search results and location pages.
    """
    query = db.query(Job).filter(Job.is_active == True)
    
    if country_id:
        query = query.filter(Job.country_id == country_id)
    if state_id:
        query = query.filter(Job.state_id == state_id)
    if city_id:
        query = query.filter(Job.city_id == city_id)
    if area_id:
        query = query.filter(Job.area_id == area_id)
    if job_type:
        if isinstance(job_type, str):
            query = query.join(JobType).filter(JobType.name == job_type)
        else:
            query = query.filter(Job.job_type_id == job_type)
    if job_category:
        if isinstance(job_category, str):
            query = query.join(JobCategory).filter(JobCategory.name == job_category)
        else:
            query = query.filter(Job.job_category_id == job_category)
    if salary_min is not None:
        query = query.filter(Job.salary_min >= salary_min)
    if salary_max is not None:
        query = query.filter(or_(Job.salary_max <= salary_max, Job.salary_min <= salary_max))
    if experience_years_min is not None:
        query = query.filter(Job.experience_years_min >= experience_years_min)
    if experience_years_max is not None:
        query = query.filter(or_(Job.experience_years_max <= experience_years_max, Job.experience_years_min <= experience_years_max))
    if q:
        from app.modules.spas.models import Spa
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Job.title.ilike(search),
                Job.description.ilike(search),
                Job.spa.has(Spa.name.ilike(search)),
                Job.job_category.has(JobCategory.name.ilike(search)),
                Job.job_type.has(JobType.name.ilike(search)),
            )
        )
    if location:
        loc_search = f"%{location.strip()}%"
        query = query.filter(
            or_(
                Job.city.has(City.name.ilike(loc_search)),
                Job.area.has(Area.name.ilike(loc_search)),
                Job.state.has(State.name.ilike(loc_search)),
            )
        )
    
    count = query.count()
    return {"count": count}


@router.get("/recent", response_model=list[schemas.JobResponse])
def get_recent_jobs(
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get newest active jobs."""
    return services.get_recent_jobs(db, limit=limit)


@router.get("/related/{job_id}", response_model=list[schemas.JobResponse])
def get_related_jobs(
    job_id: int,
    limit: int = 6,
    db: Session = Depends(get_db),
):
    """Get jobs related by category and city."""
    return services.get_related_jobs(db, job_id=job_id, limit=limit)


@router.get("/counts-by-location")
def get_job_counts_by_location(
    job_category: str | None = None,
    job_type: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Get job counts grouped by location (city).
    Returns list of cities with their job counts.
    Useful for location-based job listing pages.
    """
    from slugify import slugify
    
    query = db.query(
        City.id,
        City.name,
        func.count(Job.id).label('job_count')
    ).join(
        Job, City.id == Job.city_id
    ).filter(
        Job.is_active == True
    )
    
    if job_category:
        query = query.join(JobCategory).filter(JobCategory.name == job_category)
    if job_type:
        query = query.join(JobType).filter(JobType.name == job_type)
    
    results = query.group_by(City.id, City.name).all()
    
    return [
        {
            "city_id": city_id,
            "city_name": city_name,
            "city_slug": slugify(city_name),  # Generate slug from city name
            "job_count": job_count
        }
        for city_id, city_name, job_count in results
    ]


@router.get("/id/{job_id}", response_model=schemas.JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    """Get job by ID"""
    job = services.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/slug/{slug}", response_model=schemas.JobResponse)
def get_job_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get job by slug"""
    job = services.get_job_by_slug(db, slug)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/near-me")
def get_jobs_near_me(
    latitude: float,
    longitude: float,
    radius_km: float = 10,
    db: Session = Depends(get_db)
):
    """Get jobs near a location."""
    from app.modules.jobs.geo import get_jobs_near_location
    return get_jobs_near_location(db, latitude, longitude, radius_km)


@router.post("/{job_id}/track-view")
def track_job_view(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Increment view_count for a job and track as analytics event.

    Frontend can call this when a job detail page is viewed.
    """
    # Load job with relationships for analytics tracking
    from sqlalchemy.orm import joinedload
    job = db.query(Job).options(
        joinedload(Job.city),
        joinedload(Job.spa).joinedload("city")
    ).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Increment view count
    job.view_count = (job.view_count or 0) + 1
    db.commit()
    db.refresh(job)
    
    # Also track as analytics event
    try:
        from app.modules.analytics import trackers
        from app.utils.ip_location import get_location_from_ip
        
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Get location from job (prefer job's own location, then spa, then IP)
        city = None
        latitude = None
        longitude = None
        
        # Try job's own location first
        if job.city:
            city = job.city.name if hasattr(job.city, 'name') else None
        if job.latitude and job.longitude:
            latitude = job.latitude
            longitude = job.longitude
        
        # Fallback to spa location
        if (not latitude or not longitude) and job.spa:
            if job.spa.latitude and job.spa.longitude:
                latitude = job.spa.latitude
                longitude = job.spa.longitude
            if not city and job.spa.city:
                city = job.spa.city.name if hasattr(job.spa.city, 'name') else None
        
        # Try IP-based location if still not available
        if not latitude or not longitude:
            ip_location = get_location_from_ip(client_ip)
            if ip_location:
                latitude = latitude or ip_location.get('latitude')
                longitude = longitude or ip_location.get('longitude')
                city = city or ip_location.get('city')
        
        trackers.track_event(
            db=db,
            event_type="page_view",
            job_id=job_id,
            spa_id=job.spa_id,
            city=city,
            latitude=latitude,
            longitude=longitude,
            user_agent=user_agent,
            ip_address=client_ip,
        )
    except Exception as e:
        # Analytics should not affect main behavior
        import logging
        logging.error(f"Failed to track page view analytics: {e}")
        pass
    
    return {"status": "ok", "view_count": job.view_count}


@router.post("/{job_id}/track-apply-click")
def track_job_apply_click(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Increment apply_click_count for a job and track as analytics event.

    Frontend can call this when user clicks apply button.
    """
    # Load job with relationships for analytics tracking
    from sqlalchemy.orm import joinedload
    job = db.query(Job).options(
        joinedload(Job.city),
        joinedload(Job.spa).joinedload("city")
    ).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Increment apply click count
    job.apply_click_count = (job.apply_click_count or 0) + 1
    db.commit()
    db.refresh(job)
    
    # Also track as analytics event
    try:
        from app.modules.analytics import trackers
        from app.utils.ip_location import get_location_from_ip
        
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Get location from job (prefer job's own location, then spa, then IP)
        city = None
        latitude = None
        longitude = None
        
        # Try job's own location first
        if job.city:
            city = job.city.name if hasattr(job.city, 'name') else None
        if job.latitude and job.longitude:
            latitude = job.latitude
            longitude = job.longitude
        
        # Fallback to spa location
        if (not latitude or not longitude) and job.spa:
            if job.spa.latitude and job.spa.longitude:
                latitude = job.spa.latitude
                longitude = job.spa.longitude
            if not city and job.spa.city:
                city = job.spa.city.name if hasattr(job.spa.city, 'name') else None
        
        # Try IP-based location if still not available
        if not latitude or not longitude:
            ip_location = get_location_from_ip(client_ip)
            if ip_location:
                latitude = latitude or ip_location.get('latitude')
                longitude = longitude or ip_location.get('longitude')
                city = city or ip_location.get('city')
        
        trackers.track_event(
            db=db,
            event_type="apply_click",
            job_id=job_id,
            spa_id=job.spa_id,
            city=city,
            latitude=latitude,
            longitude=longitude,
            user_agent=user_agent,
            ip_address=client_ip,
        )
        
        # Also track as button click
        try:
            # Try to get current user if available (optional)
            user_id = None
            try:
                from app.modules.users.routes import get_current_user_optional
                current_user = get_current_user_optional(request, db)
                if current_user:
                    user_id = current_user.id
            except:
                pass
            
            trackers.track_button_click(
                db=db,
                button_type="apply",
                job_id=job_id,
                user_id=user_id,
                city=city,
                latitude=latitude,
                longitude=longitude,
                user_agent=user_agent,
                ip_address=client_ip,
            )
        except Exception as btn_err:
            # Button click tracking failure should not affect main flow
            pass
    except Exception as e:
        # Analytics should not affect main behavior
        import logging
        logging.error(f"Failed to track apply click analytics: {e}")
        pass
    
    return {"status": "ok", "apply_click_count": job.apply_click_count}


@router.get("/popular")
def get_popular_jobs(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get popular jobs sorted by view_count.
    """
    jobs = db.query(Job).filter(
        Job.is_active == True
    ).order_by(
        Job.view_count.desc()
    ).limit(limit).all()
    
    return [schemas.JobResponse.model_validate(job) for job in jobs]


@router.post("/", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job: schemas.JobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new job posting.
    
    Only authenticated users can create jobs.
    Sends email notifications to subscribers with instant frequency.
    """
    created_job = services.create_job(db, job, current_user.id)
    
    # Send instant notifications to subscribers (in background)
    if created_job and created_job.id:
        # Create a new DB session for the background task
        from app.core.database import SessionLocal
        def send_notifications():
            db_bg = SessionLocal()
            try:
                import asyncio
                asyncio.run(send_notifications_for_jobs(
                    db_bg,
                    [created_job.id],
                    SubscriptionFrequency.INSTANT
                ))
            finally:
                db_bg.close()
        
        background_tasks.add_task(send_notifications)
    
    return created_job


@router.put("/{job_id}", response_model=schemas.JobResponse)
def update_job(
    job_id: int,
    job_update: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a job posting.
    
    Only the job creator or admin can update.
    """
    job = services.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check permissions
    if job.created_by != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this job"
        )
    
    try:
        updated_job = services.update_job(db, job_id, job_update, current_user.id, current_user.role)
        return updated_job
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating job: {str(e)}"
        )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    permanent: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a job posting.
    
    - Admin: Can permanently delete (permanent=True) or soft delete
    - Job creator: Can only soft delete (permanent is ignored, always False)
    - Others: Cannot delete
    """
    job = services.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check permissions
    is_creator = job.created_by == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    
    if not is_creator and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this job"
        )
    
    # Only admin can permanently delete
    if permanent and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can permanently delete jobs"
        )
    
    # Delete: permanent for admin (if requested), soft delete otherwise
    services.delete_job(db, job_id, permanent=permanent and is_admin)
    return None
