"""
Location business logic
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.modules.locations import models, schemas
from typing import List, Optional

LOCATION_IN_USE_MESSAGE = "This location cannot be deleted because it is already used in jobs, spas, or users."


def _handle_delete_integrity_error(db: Session):
    db.rollback()
    raise ValueError(LOCATION_IN_USE_MESSAGE)


def _validate_state_country(db: Session, state_id: int, country_id: int):
    state = get_state_by_id(db, state_id)
    if not state:
        raise ValueError("State not found")
    if state.country_id != country_id:
        raise ValueError("Selected state does not belong to selected country")


def _validate_area_unique_in_city(db: Session, name: str, city_id: int, exclude_area_id: int | None = None):
    query = db.query(models.Area).filter(
        models.Area.city_id == city_id,
        models.Area.name == name,
    )
    if exclude_area_id is not None:
        query = query.filter(models.Area.id != exclude_area_id)
    if query.first():
        raise ValueError("Area with this name already exists for this city")


# Country Services
def get_country_by_id(db: Session, country_id: int):
    """Get country by ID"""
    return db.query(models.Country).filter(models.Country.id == country_id).first()


def get_all_countries(db: Session, skip: int = 0, limit: int = 100):
    """Get all countries"""
    return db.query(models.Country).offset(skip).limit(limit).all()


def create_country(db: Session, country: schemas.CountryCreate):
    """Create a new country"""
    db_country = models.Country(**country.dict())
    db.add(db_country)
    try:
        db.commit()
        db.refresh(db_country)
        return db_country
    except IntegrityError:
        db.rollback()
        raise ValueError("Country with this name already exists")


def update_country(db: Session, country_id: int, country_update: schemas.CountryUpdate):
    """Update a country"""
    db_country = get_country_by_id(db, country_id)
    if not db_country:
        return None
    
    update_data = country_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_country, field, value)
    
    try:
        db.commit()
        db.refresh(db_country)
        return db_country
    except IntegrityError:
        db.rollback()
        raise ValueError("Country with this name already exists")


def delete_country(db: Session, country_id: int):
    """Delete a country"""
    db_country = get_country_by_id(db, country_id)
    if not db_country:
        return False
    
    try:
        db.delete(db_country)
        db.commit()
    except IntegrityError:
        _handle_delete_integrity_error(db)
    return True


# State Services
def get_state_by_id(db: Session, state_id: int):
    """Get state by ID"""
    return db.query(models.State).filter(models.State.id == state_id).first()


def get_all_states(db: Session, country_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    """Get all states, optionally filtered by country"""
    query = db.query(models.State)
    if country_id:
        query = query.filter(models.State.country_id == country_id)
    return query.offset(skip).limit(limit).all()


def create_state(db: Session, state: schemas.StateCreate):
    """Create a new state"""
    db_state = models.State(**state.dict())
    db.add(db_state)
    try:
        db.commit()
        db.refresh(db_state)
        return db_state
    except IntegrityError:
        db.rollback()
        raise ValueError("State with this name already exists")


def update_state(db: Session, state_id: int, state_update: schemas.StateUpdate):
    """Update a state"""
    db_state = get_state_by_id(db, state_id)
    if not db_state:
        return None
    
    update_data = state_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_state, field, value)
    
    try:
        db.commit()
        db.refresh(db_state)
        return db_state
    except IntegrityError:
        db.rollback()
        raise ValueError("State with this name already exists")


def delete_state(db: Session, state_id: int):
    """Delete a state"""
    db_state = get_state_by_id(db, state_id)
    if not db_state:
        return False
    
    try:
        db.delete(db_state)
        db.commit()
    except IntegrityError:
        _handle_delete_integrity_error(db)
    return True


# City Services
def get_city_by_id(db: Session, city_id: int):
    """Get city by ID"""
    return db.query(models.City).filter(models.City.id == city_id).first()


def get_city_by_slug(db: Session, slug: str):
    """Get city by slug (generates slug from city name for matching)"""
    from slugify import slugify
    # Since City model doesn't have a slug field, we need to match by generating slug from name
    cities = db.query(models.City).all()
    for city in cities:
        if slugify(city.name) == slug:
            return city
    return None


def get_all_cities(db: Session, state_id: Optional[int] = None, country_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    """Get all cities, optionally filtered by state or country"""
    query = db.query(models.City)
    if state_id:
        query = query.filter(models.City.state_id == state_id)
    if country_id:
        query = query.filter(models.City.country_id == country_id)
    return query.offset(skip).limit(limit).all()


def create_city(db: Session, city: schemas.CityCreate):
    """Create a new city"""
    _validate_state_country(db, city.state_id, city.country_id)
    db_city = models.City(**city.dict())
    db.add(db_city)
    try:
        db.commit()
        db.refresh(db_city)
        return db_city
    except IntegrityError:
        db.rollback()
        raise ValueError("City with this name already exists")


def update_city(db: Session, city_id: int, city_update: schemas.CityUpdate):
    """Update a city"""
    db_city = get_city_by_id(db, city_id)
    if not db_city:
        return None
    
    update_data = city_update.dict(exclude_unset=True)
    state_id = update_data.get("state_id", db_city.state_id)
    country_id = update_data.get("country_id", db_city.country_id)
    _validate_state_country(db, state_id, country_id)

    for field, value in update_data.items():
        setattr(db_city, field, value)
    
    try:
        db.commit()
        db.refresh(db_city)
        return db_city
    except IntegrityError:
        db.rollback()
        raise ValueError("City with this name already exists")


def delete_city(db: Session, city_id: int):
    """Delete a city"""
    db_city = get_city_by_id(db, city_id)
    if not db_city:
        return False
    
    try:
        db.delete(db_city)
        db.commit()
    except IntegrityError:
        _handle_delete_integrity_error(db)
    return True


# Area Services
def get_area_by_id(db: Session, area_id: int):
    """Get area by ID"""
    return db.query(models.Area).filter(models.Area.id == area_id).first()


def get_all_areas(db: Session, city_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    """Get all areas, optionally filtered by city"""
    query = db.query(models.Area)
    if city_id:
        query = query.filter(models.Area.city_id == city_id)
    return query.offset(skip).limit(limit).all()


def create_area(db: Session, area: schemas.AreaCreate):
    """Create a new area"""
    _validate_area_unique_in_city(db, area.name, area.city_id)
    db_area = models.Area(**area.dict())
    db.add(db_area)
    try:
        db.commit()
        db.refresh(db_area)
        return db_area
    except IntegrityError:
        db.rollback()
        raise ValueError("Area with this name already exists for this city")


def update_area(db: Session, area_id: int, area_update: schemas.AreaUpdate):
    """Update an area"""
    db_area = get_area_by_id(db, area_id)
    if not db_area:
        return None
    
    update_data = area_update.dict(exclude_unset=True)
    name = update_data.get("name", db_area.name)
    city_id = update_data.get("city_id", db_area.city_id)
    _validate_area_unique_in_city(db, name, city_id, exclude_area_id=area_id)

    for field, value in update_data.items():
        setattr(db_area, field, value)
    
    try:
        db.commit()
        db.refresh(db_area)
        return db_area
    except IntegrityError:
        db.rollback()
        raise ValueError("Area with this name already exists for this city")


def delete_area(db: Session, area_id: int):
    """Delete an area"""
    db_area = get_area_by_id(db, area_id)
    if not db_area:
        return False
    
    try:
        db.delete(db_area)
        db.commit()
    except IntegrityError:
        _handle_delete_integrity_error(db)
    return True

