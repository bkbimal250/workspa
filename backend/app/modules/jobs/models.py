"""
Job models
"""

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, event, select, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from slugify import slugify

from app.core.database import Base
from app.utils.seo_utils import generate_unique_slug


class JobType(Base):
    __tablename__ = "job_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = relationship("Job", back_populates="job_type")


class JobCategory(Base):
    __tablename__ = "job_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = relationship("Job", back_populates="job_category")




class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("idx_jobs_active_created_at", "is_active", "created_at"),
        Index("idx_jobs_active_city_category", "is_active", "city_id", "job_category_id"),
        Index("idx_jobs_active_area_category", "is_active", "area_id", "job_category_id"),
        Index("idx_jobs_active_slug", "is_active", "slug"),
    )

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    job_opening_count = Column(Integer, default=1, nullable=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    responsibilities = Column(Text)
    benefits = Column(Text, nullable=True)
    job_timing = Column(String(255), nullable=True)
    key_skills = Column(Text)
    Industry_type = Column(String(255), nullable=False,default="Beauty and Spa")
    Employee_type = Column(String(255), nullable=False,default="Full Time")
    required_gender=Column(String(255), nullable=False,default="Female")


    salary_min = Column(Integer)
    salary_max = Column(Integer)
    salary_currency = Column(String(3), default="INR")
    experience_years_min = Column(Integer)
    experience_years_max = Column(Integer)
    job_type_id = Column(Integer, ForeignKey("job_types.id"), index=True)
    job_category_id = Column(Integer, ForeignKey("job_categories.id"), index=True)

    spa_id = Column(Integer, ForeignKey("spas.id"), index=True)

    # Location foreign keys
    country_id = Column(Integer, ForeignKey("countries.id"), index=True)
    state_id = Column(Integer, ForeignKey("states.id"), index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), index=True)
    area_id = Column(Integer, ForeignKey("areas.id"), index=True, nullable=True)

    postalCode = Column(String(10), nullable=True)
    
    # Coordinates (auto-filled from Spa if not provided)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # HR contact fields
    hr_contact_name = Column(String(100), nullable=True)
    hr_contact_email = Column(String(100), nullable=True)
    hr_contact_phone = Column(String(20), nullable=True)

    # Status & popularity
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    # Simple counters for popularity without needing to query analytics table
    view_count = Column(Integer, default=0, index=True)
    apply_click_count = Column(Integer, default=0)
    message_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime)

    created_by = Column(Integer, ForeignKey("users.id"), index=True)
    updated_by = Column(Integer, ForeignKey("users.id"), index=True)

    # SEO fields
    meta_title = Column(String(60))
    meta_description = Column(String(160))
    schema_json = Column(Text)
    canonical_url = Column(String(255))

    # Relationships
    spa = relationship("Spa", back_populates="jobs")
    country = relationship("Country", back_populates="jobs")
    state = relationship("State", back_populates="jobs")
    city = relationship("City", back_populates="jobs")
    area = relationship("Area", back_populates="jobs")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="created_jobs")
    updated_by_user = relationship("User", foreign_keys=[updated_by], back_populates="updated_jobs")
    job_type = relationship("JobType")
    job_category = relationship("JobCategory")
    messages = relationship("Message", back_populates="job")


@event.listens_for(JobType, "before_insert")
def generate_jobtype_slug(mapper, connection, target: JobType) -> None:
    """
    Automatically generate an SEO-friendly, unique slug for JobType
    from its name when none is provided.
    """
    if not target.slug and target.name:
        target.slug = generate_unique_slug(target.name)


@event.listens_for(JobCategory, "before_insert")
def generate_jobcategory_slug(mapper, connection, target: JobCategory) -> None:
    """
    Automatically generate an SEO-friendly, unique slug for JobCategory
    from its name when none is provided.
    """
    if not target.slug and target.name:
        target.slug = generate_unique_slug(target.name)


@event.listens_for(Job, "before_insert")
def generate_job_slug(mapper, connection, target: Job) -> None:
    """
    Automatically generate an SEO-friendly, unique slug for Job
    from its title.state-city-area-address when none is provided.
    Format: title.state-city-area-address
    """
    if not target.slug and target.title:
        from app.modules.locations.models import State, City, Area
        
        parts = [target.title]
        
        # Add location parts if available
        location_parts = []
        
        # Get state name
        if target.state_id:
            try:
                result = connection.execute(select(State.name).where(State.id == target.state_id)).scalar_one_or_none()
                if result:
                    location_parts.append(result)
            except Exception:
                pass  # Skip if state not found
        
        # Get city name
        if target.city_id:
            try:
                result = connection.execute(select(City.name).where(City.id == target.city_id)).scalar_one_or_none()
                if result:
                    location_parts.append(result)
            except Exception:
                pass  # Skip if city not found
        
        # Get area name
        if target.area_id:
            try:
                result = connection.execute(select(Area.name).where(Area.id == target.area_id)).scalar_one_or_none()
                if result:
                    location_parts.append(result)
            except Exception:
                pass  # Skip if area not found
        
        # Get address from related SPA if available
        if target.spa_id:
            try:
                from app.modules.spas.models import Spa
                result = connection.execute(select(Spa.address).where(Spa.id == target.spa_id)).scalar_one_or_none()
                if result:
                    address_words = result.split()[:3]  # First 3 words
                    location_parts.append(' '.join(address_words))
            except Exception:
                pass  # Skip if spa not found
        
        # Join location parts with hyphens
        if location_parts:
            location_str = '-'.join(location_parts)
            parts.append(location_str)
        
        base_slug = slugify('.'.join(parts))
        slug = base_slug
        index = 2
        
        # Ensure uniqueness
        while connection.execute(
            select(Job.id).where(Job.slug == slug)
        ).scalar() is not None:
            slug = f"{base_slug}-{index}"
            index += 1
        
        target.slug = slug


@event.listens_for(Job, "before_update")
def protect_job_slug_on_update(mapper, connection, target: Job) -> None:
    """
    SEO best practice: do NOT change slug automatically when title changes.
    Only (re)generate if slug is missing.
    Format: title.state-city-area-address
    """
    if not target.slug and target.title:
        from app.modules.locations.models import State, City, Area
        
        parts = [target.title]
        
        # Add location parts if available
        location_parts = []
        
        # Get state name
        if target.state_id:
            try:
                result = connection.execute(select(State.name).where(State.id == target.state_id)).scalar_one_or_none()
                if result:
                    location_parts.append(result)
            except Exception:
                pass  # Skip if state not found
        
        # Get city name
        if target.city_id:
            try:
                result = connection.execute(select(City.name).where(City.id == target.city_id)).scalar_one_or_none()
                if result:
                    location_parts.append(result)
            except Exception:
                pass  # Skip if city not found
        
        # Get area name
        if target.area_id:
            try:
                result = connection.execute(select(Area.name).where(Area.id == target.area_id)).scalar_one_or_none()
                if result:
                    location_parts.append(result)
            except Exception:
                pass  # Skip if area not found
        
        # Get address from related SPA if available
        if target.spa_id:
            try:
                from app.modules.spas.models import Spa
                result = connection.execute(select(Spa.address).where(Spa.id == target.spa_id)).scalar_one_or_none()
                if result:
                    address_words = result.split()[:3]  # First 3 words
                    location_parts.append(' '.join(address_words))
            except Exception:
                pass  # Skip if spa not found
        
        # Join location parts with hyphens
        if location_parts:
            location_str = '-'.join(location_parts)
            parts.append(location_str)
        
        base_slug = slugify('.'.join(parts))
        slug = base_slug
        index = 2
        
        # Ensure uniqueness
        while connection.execute(
            select(Job.id).where(Job.slug == slug, Job.id != target.id)
        ).scalar() is not None:
            slug = f"{base_slug}-{index}"
            index += 1
        
        target.slug = slug

class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)  # Optional: can apply without login
    
    # Application details (can use user profile or manual entry)
    name = Column(String)
    phone = Column(String)
    email = Column(String)
    experience = Column(String)
    cv_file_path = Column(String)  # Can use user's resume or upload new one
    location = Column(String)
    
    # Status
    status = Column(String, default="pending")  # pending, reviewed, accepted, rejected
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job")

