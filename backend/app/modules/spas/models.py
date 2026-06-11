"""
SPA models
"""

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, JSON, DateTime, event, select, Index
from sqlalchemy.orm import relationship
from slugify import slugify
from datetime import datetime
from app.core.database import Base


class Spa(Base):
    __tablename__ = "spas"
    __table_args__ = (
        Index("idx_spas_active_city_area", "is_active", "city_id", "area_id"),
        Index("idx_spas_active_slug", "is_active", "slug"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True)
    description = Column(Text)
    phone = Column(String)
    email = Column(String)
    logo_image = Column(String, nullable=True)
    address = Column(Text)
    website = Column(String, nullable=True)
    directions = Column(Text, nullable=True)
    opening_hours = Column(String, nullable=True)
    closing_hours = Column(String, nullable=True)
    booking_url_website = Column(String, nullable=True)
    booking_click_count = Column(Integer, default=0)
    country_id = Column(Integer, ForeignKey("countries.id"), index=True)
    state_id = Column(Integer, ForeignKey("states.id"), index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), index=True)
    area_id = Column(Integer, ForeignKey("areas.id"), index=True, nullable=True)
    postalCode = Column(String(10), nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    spa_images = Column(JSON, nullable=True)
    rating = Column(Float, default=0.0)
    reviews = Column(Float,default=0.0)

    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)
    updated_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="created_spas")
    updated_by_user = relationship("User", foreign_keys=[updated_by], back_populates="updated_spas")
    jobs = relationship("Job", back_populates="spa")
    country = relationship("Country", back_populates="spas")
    state = relationship("State", back_populates="spas")
    city = relationship("City", back_populates="spas")
    area = relationship("Area", back_populates="spas")


@event.listens_for(Spa, "before_insert")
def spa_generate_slug_before_insert(mapper, connection, target: Spa) -> None:
    """
    Automatically generate SEO-friendly, unique slug from name.state-city-area-address
    when creating a Spa, if slug is not provided.
    Format: name.state-city-area-address
    """
    if not target.slug and target.name:
        from app.modules.locations.models import State, City, Area
        
        parts = [target.name]
        
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
        
        # Add address parts
        if target.address:
            # Take first few words from address for slug
            address_words = target.address.split()[:3]  # First 3 words
            location_parts.append(' '.join(address_words))
        
        # Join location parts with hyphens
        if location_parts:
            location_str = '-'.join(location_parts)
            parts.append(location_str)
        
        base_slug = slugify('.'.join(parts))
        slug = base_slug
        index = 2

        # Ensure uniqueness by appending "-2", "-3", ... if needed
        while connection.execute(
            select(Spa.id).where(Spa.slug == slug)
        ).scalar() is not None:
            slug = f"{base_slug}-{index}"
            index += 1

        target.slug = slug


@event.listens_for(Spa, "before_update")
def spa_generate_slug_before_update(mapper, connection, target: Spa) -> None:
    """
    If slug is empty but name is present on update, generate slug.
    We don't overwrite an existing slug to avoid breaking URLs.
    Format: name.state-city-area-address
    """
    if not target.slug and target.name:
        from app.modules.locations.models import State, City, Area
        
        parts = [target.name]
        
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
        
        # Add address parts
        if target.address:
            # Take first few words from address for slug
            address_words = target.address.split()[:3]  # First 3 words
            location_parts.append(' '.join(address_words))
        
        # Join location parts with hyphens
        if location_parts:
            location_str = '-'.join(location_parts)
            parts.append(location_str)
        
        base_slug = slugify('.'.join(parts))
        slug = base_slug
        index = 2

        # Ensure uniqueness on update as well
        while connection.execute(
            select(Spa.id).where(Spa.slug == slug, Spa.id != target.id)
        ).scalar() is not None:
            slug = f"{base_slug}-{index}"
            index += 1

        target.slug = slug
