"""
Location models (Country, State, City, Area, ResolvedLocation)
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    # Relationships
    states = relationship("State", back_populates="country")
    cities = relationship("City", back_populates="country")
    jobs = relationship("Job", back_populates="country")
    spas = relationship("Spa", back_populates="country")
    users = relationship("User", back_populates="country")


class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    
    # Relationships
    country = relationship("Country", back_populates="states")
    cities = relationship("City", back_populates="state")
    jobs = relationship("Job", back_populates="state")
    spas = relationship("Spa", back_populates="state")
    users = relationship("User", back_populates="state")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    
    # Relationships
    state = relationship("State", back_populates="cities")
    country = relationship("Country", back_populates="cities")
    areas = relationship("Area", back_populates="city")
    jobs = relationship("Job", back_populates="city")
    spas = relationship("Spa", back_populates="city")
    users = relationship("User", back_populates="city")


class Area(Base):
    __tablename__ = "areas"
    __table_args__ = (
        UniqueConstraint("city_id", "name", name="uq_areas_city_id_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), index=True, nullable=False)
    
    # Relationships
    city = relationship("City", back_populates="areas")
    jobs = relationship("Job", back_populates="area")
    spas = relationship("Spa", back_populates="area")


class ResolvedLocation(Base):
    """
    Cache for reverse geocoded locations to avoid hitting Nominatim API repeatedly
    """
    __tablename__ = "resolved_locations"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    
    # Resolved address components
    city = Column(String, nullable=True, index=True)
    area = Column(String, nullable=True)  # suburb, neighborhood, etc.
    state = Column(String, nullable=True, index=True)
    country = Column(String, nullable=True, index=True)
    postcode = Column(String, nullable=True)
    
    # Full formatted address
    formatted_address = Column(String, nullable=True)
    
    # Cache management
    last_used = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Composite index for fast lat/lng lookups
    __table_args__ = (
        Index('idx_lat_lng', 'latitude', 'longitude'),
    )
