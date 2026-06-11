"""
Job business logic
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.modules.jobs import models, schemas
from app.modules.spas.models import Spa


def get_job_by_slug(db: Session, slug: str):
    """Get job by slug"""
    from sqlalchemy.orm import joinedload
    return db.query(models.Job).options(
        joinedload(models.Job.city),
        joinedload(models.Job.area),
        joinedload(models.Job.state),
        joinedload(models.Job.country),
        joinedload(models.Job.spa),
        joinedload(models.Job.job_type),
        joinedload(models.Job.job_category),
        joinedload(models.Job.created_by_user),
    ).filter(models.Job.slug == slug).first()


def get_job_by_id(db: Session, job_id: int):
    """Get job by ID"""
    from sqlalchemy.orm import joinedload
    return db.query(models.Job).options(
        joinedload(models.Job.city),
        joinedload(models.Job.area),
        joinedload(models.Job.state),
        joinedload(models.Job.country),
        joinedload(models.Job.spa),
        joinedload(models.Job.job_type),
        joinedload(models.Job.job_category),
        joinedload(models.Job.created_by_user),
    ).filter(models.Job.id == job_id).first()


def get_jobs(
    db: Session,
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
):
    """
    Get active jobs with optional filters.

    Used by frontend for filtering by country/state/city/area,
    job type/category, featured, etc.
    """
    query = db.query(models.Job).filter(models.Job.is_active == True)

    if country_id is not None:
        query = query.filter(models.Job.country_id == country_id)
    if state_id is not None:
        query = query.filter(models.Job.state_id == state_id)
    if city_id is not None:
        query = query.filter(models.Job.city_id == city_id)
    if area_id is not None:
        query = query.filter(models.Job.area_id == area_id)
    if spa_id is not None:
        query = query.filter(models.Job.spa_id == spa_id)
    if job_type is not None:
        # job_type can be a string (name) or ID - handle both
        if isinstance(job_type, str):
            # Filter by job type name through the relationship
            query = query.join(models.JobType).filter(models.JobType.name == job_type)
        else:
            # Assume it's an ID
            query = query.filter(models.Job.job_type_id == job_type)
    if job_category is not None:
        # job_category can be a string (name) or ID - handle both
        if isinstance(job_category, str):
            # Filter by job category name through the relationship
            query = query.join(models.JobCategory).filter(models.JobCategory.name == job_category)
        else:
            # Assume it's an ID
            query = query.filter(models.Job.job_category_id == job_category)
    if is_featured is not None:
        query = query.filter(models.Job.is_featured == is_featured)
    if salary_min is not None:
        query = query.filter(models.Job.salary_min >= salary_min)
    if salary_max is not None:
        query = query.filter(or_(models.Job.salary_max <= salary_max, models.Job.salary_min <= salary_max))
    if experience_years_min is not None:
        query = query.filter(models.Job.experience_years_min >= experience_years_min)
    if experience_years_max is not None:
        query = query.filter(or_(models.Job.experience_years_max <= experience_years_max, models.Job.experience_years_min <= experience_years_max))
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Job.title.ilike(search),
                models.Job.description.ilike(search),
                models.Job.spa.has(Spa.name.ilike(search)),
                models.Job.job_category.has(models.JobCategory.name.ilike(search)),
                models.Job.job_type.has(models.JobType.name.ilike(search)),
            )
        )
    if location:
        from app.modules.locations.models import City, Area, State

        loc_search = f"%{location.strip()}%"
        query = query.filter(
            or_(
                models.Job.city.has(City.name.ilike(loc_search)),
                models.Job.area.has(Area.name.ilike(loc_search)),
                models.Job.state.has(State.name.ilike(loc_search)),
            )
        )

    # Eagerly load relationships for better performance
    from sqlalchemy.orm import joinedload
    query = query.options(
        joinedload(models.Job.city),
        joinedload(models.Job.area),
        joinedload(models.Job.state),
        joinedload(models.Job.country),
        joinedload(models.Job.spa),
        joinedload(models.Job.job_type),
        joinedload(models.Job.job_category),
        joinedload(models.Job.created_by_user),
    )

    if sort_by == "popular":
        query = query.order_by(models.Job.view_count.desc(), models.Job.apply_click_count.desc())
    elif sort_by == "salary":
        query = query.order_by(models.Job.salary_min.desc().nullslast(), models.Job.created_at.desc())
    else:
        query = query.order_by(models.Job.created_at.desc())

    return query.offset(skip).limit(limit).all()


def get_related_jobs(db: Session, job_id: int, limit: int = 6):
    """Return active jobs related by category first, then city."""
    job = get_job_by_id(db, job_id)
    if not job:
        return []

    from sqlalchemy.orm import joinedload

    query = (
        db.query(models.Job)
        .options(
            joinedload(models.Job.city),
            joinedload(models.Job.area),
            joinedload(models.Job.state),
            joinedload(models.Job.country),
            joinedload(models.Job.spa),
            joinedload(models.Job.job_type),
            joinedload(models.Job.job_category),
        )
        .filter(models.Job.is_active == True, models.Job.id != job_id)
    )

    related_filter = []
    if job.job_category_id:
        related_filter.append(models.Job.job_category_id == job.job_category_id)
    if job.city_id:
        related_filter.append(models.Job.city_id == job.city_id)
    if related_filter:
        query = query.filter(or_(*related_filter))

    return (
        query.order_by(
            (models.Job.job_category_id == job.job_category_id).desc() if job.job_category_id else models.Job.created_at.desc(),
            models.Job.created_at.desc(),
        )
        .limit(limit)
        .all()
    )


def get_recent_jobs(db: Session, limit: int = 10):
    """Return newest active jobs."""
    from sqlalchemy.orm import joinedload

    return (
        db.query(models.Job)
        .options(
            joinedload(models.Job.city),
            joinedload(models.Job.area),
            joinedload(models.Job.state),
            joinedload(models.Job.country),
            joinedload(models.Job.spa),
            joinedload(models.Job.job_type),
            joinedload(models.Job.job_category),
        )
        .filter(models.Job.is_active == True)
        .order_by(models.Job.created_at.desc())
        .limit(limit)
        .all()
    )


def get_recruiter_jobs(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get jobs for a recruiter's managed SPA"""
    from app.modules.users.models import User
    from sqlalchemy.orm import joinedload
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.managed_spa_id:
        return []
    
    return db.query(models.Job).options(
        joinedload(models.Job.city),
        joinedload(models.Job.area),
        joinedload(models.Job.state),
        joinedload(models.Job.country),
        joinedload(models.Job.spa),
        joinedload(models.Job.job_type),
        joinedload(models.Job.job_category),
        joinedload(models.Job.created_by_user),
    ).filter(
        models.Job.spa_id == user.managed_spa_id
    ).order_by(models.Job.created_at.desc()).offset(skip).limit(limit).all()


def create_job(db: Session, job: schemas.JobCreate, user_id: int, user_role: str = None):
    """
    Create a new job.

    If latitude/longitude are not provided, they are automatically
    copied from the related Spa (based on spa_id).
    
    Permissions:
    - Recruiters can only post jobs on their own managed SPA
    - Managers and Admins can post jobs on any SPA (full access)
    """
    from app.modules.users.models import User, UserRole
    
    # Get dict using by_alias=False to get internal field names (seo_schema_json)
    # We'll map it to schema_json for the model
    job_dict = job.model_dump(exclude_none=False, by_alias=False)
    
    # Filter out callable values and ensure only valid types are included
    job_data = {}
    for key, value in job_dict.items():
        # Skip callable objects (methods) - this handles the schema_json method issue
        if callable(value):
            continue
        # Only include valid serializable types
        if value is None or isinstance(value, (str, int, float, bool, list, dict, datetime)):
            job_data[key] = value
        elif hasattr(value, 'isoformat'):  # datetime-like objects
            job_data[key] = value
        # Skip everything else (methods, etc.)
    
    # Get the SPA to check permissions
    spa = db.query(Spa).filter(Spa.id == job_data["spa_id"]).first()
    if not spa:
        raise ValueError("SPA not found")
    
    # Check permissions based on user role
    if user_role == UserRole.RECRUITER:
        # Recruiters can only post jobs on their own managed SPA
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.managed_spa_id:
            raise ValueError("Recruiters must have a managed SPA to post jobs")
        if job_data["spa_id"] != user.managed_spa_id:
            raise ValueError("Recruiters can only post jobs on their own SPA")
    elif user_role in [UserRole.ADMIN, UserRole.MANAGER]:
        # Admins and Managers can post jobs on any SPA - no restrictions
        pass

    # Auto-fill latitude/longitude from Spa if missing
    if job_data.get("latitude") is None or job_data.get("longitude") is None:
        if spa:
            job_data["latitude"] = spa.latitude
            job_data["longitude"] = spa.longitude

    job_data["created_by"] = user_id
    job_data["updated_by"] = user_id
    
    # Map seo_schema_json (from schema) to schema_json (model field)
    if "seo_schema_json" in job_data:
        job_data["schema_json"] = job_data.pop("seo_schema_json")
    
    # Ensure schema_json and other optional fields are properly handled (remove any callable values)
    fields_to_check = ["schema_json", "canonical_url", "meta_title", "meta_description"]
    for field in fields_to_check:
        if field in job_data and (job_data[field] is None or callable(job_data[field]) or not isinstance(job_data[field], (str, type(None)))):
            job_data[field] = None

    db_job = models.Job(**job_data)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


def update_job(db: Session, job_id: int, job_update: schemas.JobUpdate, user_id: int, user_role: str = None):
    """Update an existing job
    
    Permissions:
    - Recruiters can only update jobs on their own managed SPA
    - Managers and Admins can update any job (full access)
    """
    from app.modules.users.models import User, UserRole
    
    job = get_job_by_id(db, job_id)
    if not job:
        return None
    
    update_data = job_update.model_dump(exclude_unset=True, by_alias=False)
    
    # Get the current SPA to check permissions
    current_spa = db.query(Spa).filter(Spa.id == job.spa_id).first()
    if not current_spa:
        raise ValueError("SPA not found for this job")
    
    # Check permissions based on user role
    if user_role == UserRole.RECRUITER:
        # Recruiters can only update jobs on their own SPA
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.managed_spa_id:
            raise ValueError("Recruiters must have a managed SPA to update jobs")
        if job.spa_id != user.managed_spa_id:
            raise ValueError("Recruiters can only update jobs on their own SPA")
        
        # Also check if spa_id is being changed
        if "spa_id" in update_data and update_data["spa_id"] != user.managed_spa_id:
            raise ValueError("Recruiters can only assign jobs to their own SPA")
    elif user_role in [UserRole.ADMIN, UserRole.MANAGER]:
        # Admins and Managers can update any job - no restrictions
        pass
    
    # Auto-fill latitude/longitude from Spa if missing and spa_id changed
    if "spa_id" in update_data and (update_data.get("latitude") is None or update_data.get("longitude") is None):
        spa = db.query(Spa).filter(Spa.id == update_data["spa_id"]).first()
        if spa:
            update_data["latitude"] = spa.latitude
            update_data["longitude"] = spa.longitude
    
    # Map seo_schema_json (from schema) to schema_json (model field)
    if "seo_schema_json" in update_data:
        update_data["schema_json"] = update_data.pop("seo_schema_json")
    
    for field, value in update_data.items():
        setattr(job, field, value)
    
    job.updated_by = user_id
    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job_id: int, permanent: bool = False):
    """
    Delete a job.
    - If permanent=True: Permanently delete from database (admin only)
    - If permanent=False: Soft delete by setting is_active=False (for non-admin users)
    """
    job = get_job_by_id(db, job_id)
    if not job:
        return False
    
    if permanent:
        # Permanent delete - only for admin
        db.delete(job)
    else:
        # Soft delete - for non-admin users
        job.is_active = False
    
    db.commit()
    return True


def increment_job_view(db: Session, job_id: int) -> models.Job | None:
    """Increase view_count when a job detail page is viewed."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        return None
    job.view_count = (job.view_count or 0) + 1
    db.commit()
    db.refresh(job)
    return job


def increment_job_apply_click(db: Session, job_id: int) -> models.Job | None:
    """Increase apply_click_count when the apply button is clicked."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        return None
    job.apply_click_count = (job.apply_click_count or 0) + 1
    db.commit()
    db.refresh(job)
    return job


def increment_job_message_count(db: Session, job_id: int) -> models.Job | None:
    """Increase message_count when a message is sent about this job."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        return None
    job.message_count = (job.message_count or 0) + 1
    db.commit()
    db.refresh(job)
    return job


def get_popular_jobs(db: Session, limit: int = 10):
    """
    Return popular jobs ordered by view_count (and then apply_click_count).

    This is fast and works even without hitting the analytics_events table.
    """
    from sqlalchemy.orm import joinedload
    return (
        db.query(models.Job)
        .options(
            joinedload(models.Job.city),
            joinedload(models.Job.area),
            joinedload(models.Job.state),
            joinedload(models.Job.country),
            joinedload(models.Job.spa),
            joinedload(models.Job.job_type),
            joinedload(models.Job.job_category),
        )
        .filter(models.Job.is_active == True)
        .order_by(models.Job.view_count.desc(), models.Job.apply_click_count.desc())
        .limit(limit)
        .all()
    )


def get_job_counts_by_state(db: Session):
    """
    Return total job counts grouped by state_id.
    Frontend can join with locations API to show state names + counts.
    """
    results = (
        db.query(models.Job.state_id, func.count(models.Job.id).label("job_count"))
        .filter(models.Job.is_active == True)
        .group_by(models.Job.state_id)
        .all()
    )
    return [{"state_id": state_id, "job_count": count} for state_id, count in results]


def get_job_counts_by_city(db: Session):
    """Return total job counts grouped by city_id."""
    results = (
        db.query(models.Job.city_id, func.count(models.Job.id).label("job_count"))
        .filter(models.Job.is_active == True)
        .group_by(models.Job.city_id)
        .all()
    )
    return [{"city_id": city_id, "job_count": count} for city_id, count in results]


def get_job_counts_by_area(db: Session):
    """Return total job counts grouped by area_id."""
    results = (
        db.query(models.Job.area_id, func.count(models.Job.id).label("job_count"))
        .filter(models.Job.is_active == True)
        .group_by(models.Job.area_id)
        .all()
    )
    return [{"area_id": area_id, "job_count": count} for area_id, count in results]


# JobType Services
def get_all_job_types(db: Session, skip: int = 0, limit: int = 100):
    """Get all job types"""
    return db.query(models.JobType).offset(skip).limit(limit).all()


def get_job_type_by_id(db: Session, job_type_id: int):
    """Get job type by ID"""
    return db.query(models.JobType).filter(models.JobType.id == job_type_id).first()


def create_job_type(db: Session, job_type: schemas.JobTypeCreate):
    """Create a new job type"""
    db_job_type = models.JobType(**job_type.dict())
    db.add(db_job_type)
    db.commit()
    db.refresh(db_job_type)
    return db_job_type


def update_job_type(db: Session, job_type_id: int, job_type_update: schemas.JobTypeUpdate):
    """Update a job type"""
    db_job_type = get_job_type_by_id(db, job_type_id)
    if not db_job_type:
        return None
    
    update_data = job_type_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_job_type, field, value)
    
    db.commit()
    db.refresh(db_job_type)
    return db_job_type


def delete_job_type(db: Session, job_type_id: int):
    """Delete a job type"""
    db_job_type = get_job_type_by_id(db, job_type_id)
    if not db_job_type:
        return False
    
    db.delete(db_job_type)
    db.commit()
    return True


# JobCategory Services
def get_all_job_categories(db: Session, skip: int = 0, limit: int = 100):
    """Get all job categories"""
    return db.query(models.JobCategory).offset(skip).limit(limit).all()


def get_job_category_by_id(db: Session, job_category_id: int):
    """Get job category by ID"""
    return db.query(models.JobCategory).filter(models.JobCategory.id == job_category_id).first()


def create_job_category(db: Session, job_category: schemas.JobCategoryCreate):
    """Create a new job category"""
    db_job_category = models.JobCategory(**job_category.dict())
    db.add(db_job_category)
    db.commit()
    db.refresh(db_job_category)
    return db_job_category


def update_job_category(db: Session, job_category_id: int, job_category_update: schemas.JobCategoryUpdate):
    """Update a job category"""
    db_job_category = get_job_category_by_id(db, job_category_id)
    if not db_job_category:
        return None
    
    update_data = job_category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_job_category, field, value)
    
    db.commit()
    db.refresh(db_job_category)
    return db_job_category


def delete_job_category(db: Session, job_category_id: int):
    """Delete a job category"""
    db_job_category = get_job_category_by_id(db, job_category_id)
    if not db_job_category:
        return False
    
    db.delete(db_job_category)
    db.commit()
    return True

