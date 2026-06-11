"""
Location API routes
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.modules.locations import schemas, services, geocoding
from app.modules.users.routes import get_current_user, require_role
from app.modules.users.models import User, UserRole
import httpx
from app.utils.ip_location import get_location_from_ip

router = APIRouter(prefix="/api/locations", tags=["locations"])


@router.get("/countries", response_model=List[schemas.CountryResponse])
def get_countries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all countries"""
    return services.get_all_countries(db, skip=skip, limit=limit)


@router.post("/countries", response_model=schemas.CountryResponse, status_code=status.HTTP_201_CREATED)
def create_country(
    country: schemas.CountryCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Create a new country (admin/manager only)"""
    try:
        return services.create_country(db, country)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/countries/{country_id}", response_model=schemas.CountryResponse)
def get_country(
    country_id: int,
    db: Session = Depends(get_db)
):
    """Get country by ID"""
    country = services.get_country_by_id(db, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country


@router.put("/countries/{country_id}", response_model=schemas.CountryResponse)
def update_country(
    country_id: int,
    country_update: schemas.CountryUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Update a country (admin/manager only)"""
    try:
        updated = services.update_country(db, country_id, country_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Country not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/countries/{country_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_country(
    country_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Delete a country (admin only)"""
    try:
        deleted = services.delete_country(db, country_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Country not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None


@router.get("/states", response_model=List[schemas.StateResponse])
def get_states(
    country_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all states, optionally filtered by country"""
    return services.get_all_states(db, country_id=country_id, skip=skip, limit=limit)


@router.post("/states", response_model=schemas.StateResponse, status_code=status.HTTP_201_CREATED)
def create_state(
    state: schemas.StateCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Create a new state (admin/manager only)"""
    try:
        return services.create_state(db, state)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/states/{state_id}", response_model=schemas.StateResponse)
def get_state(
    state_id: int,
    db: Session = Depends(get_db)
):
    """Get state by ID"""
    state = services.get_state_by_id(db, state_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state


@router.put("/states/{state_id}", response_model=schemas.StateResponse)
def update_state(
    state_id: int,
    state_update: schemas.StateUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Update a state (admin/manager only)"""
    try:
        updated = services.update_state(db, state_id, state_update)
        if not updated:
            raise HTTPException(status_code=404, detail="State not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/states/{state_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_state(
    state_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Delete a state (admin only)"""
    try:
        deleted = services.delete_state(db, state_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="State not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None


@router.get("/cities", response_model=List[schemas.CityResponse])
def get_cities(
    state_id: Optional[int] = None,
    country_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all cities, optionally filtered by state or country"""
    return services.get_all_cities(db, state_id=state_id, country_id=country_id, skip=skip, limit=limit)


@router.post("/cities", response_model=schemas.CityResponse, status_code=status.HTTP_201_CREATED)
def create_city(
    city: schemas.CityCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Create a new city (admin/manager only)"""
    try:
        return services.create_city(db, city)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cities/{city_id}", response_model=schemas.CityResponse)
def get_city_by_id(
    city_id: int,
    db: Session = Depends(get_db)
):
    """Get city by ID"""
    city = services.get_city_by_id(db, city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


@router.put("/cities/{city_id}", response_model=schemas.CityResponse)
def update_city(
    city_id: int,
    city_update: schemas.CityUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Update a city (admin/manager only)"""
    try:
        updated = services.update_city(db, city_id, city_update)
        if not updated:
            raise HTTPException(status_code=404, detail="City not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/cities/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_city(
    city_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Delete a city (admin only)"""
    try:
        deleted = services.delete_city(db, city_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="City not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None


@router.get("/areas", response_model=List[schemas.AreaResponse])
def get_areas(
    city_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all areas, optionally filtered by city"""
    return services.get_all_areas(db, city_id=city_id, skip=skip, limit=limit)


@router.post("/areas", response_model=schemas.AreaResponse, status_code=status.HTTP_201_CREATED)
def create_area(
    area: schemas.AreaCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Create a new area (admin/manager only)"""
    try:
        return services.create_area(db, area)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/areas/{area_id}", response_model=schemas.AreaResponse)
def get_area(
    area_id: int,
    db: Session = Depends(get_db)
):
    """Get area by ID"""
    area = services.get_area_by_id(db, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return area


@router.put("/areas/{area_id}", response_model=schemas.AreaResponse)
def update_area(
    area_id: int,
    area_update: schemas.AreaUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    """Update an area (admin/manager only)"""
    try:
        updated = services.update_area(db, area_id, area_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Area not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/areas/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(
    area_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Delete an area (admin only)"""
    try:
        deleted = services.delete_area(db, area_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Area not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return None


@router.get("/cities/slug/{slug}", response_model=schemas.CityResponse)
def get_city(slug: str, db: Session = Depends(get_db)):
    """Get city by slug"""
    city = services.get_city_by_slug(db, slug)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


@router.post("/reverse-geocode", response_model=schemas.ReverseGeocodeResponse)
async def reverse_geocode(
    request: schemas.ReverseGeocodeRequest,
    db: Session = Depends(get_db)
):
    """
    Reverse geocode latitude/longitude to address using OpenStreetMap Nominatim
    Results are cached to avoid hitting the API repeatedly
    """
    if not (-90 <= request.latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude")
    if not (-180 <= request.longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid longitude")
    
    result = await geocoding.reverse_geocode(
        db, request.latitude, request.longitude
    )
    
    if not result:
        raise HTTPException(
            status_code=404, 
            detail="Could not reverse geocode this location"
        )
    
    return result


@router.get("/ip-location", response_model=schemas.IPLocationResponse)
async def get_ip_location(request: Request):
    """
    Get approximate location based on IP address (fallback when geolocation is denied)
    Uses free ipapi.co service
    """
    # Get client IP
    client_ip = request.client.host if request.client else None
    
    # If behind proxy, try to get real IP from headers
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    if not client_ip or client_ip == "127.0.0.1":
        # Localhost - return default or error
        return schemas.IPLocationResponse(
            city=None,
            state=None,
            country=None,
            latitude=None,
            longitude=None,
        )
    
    try:
        # Use ipapi.co free service
        url = f"https://ipapi.co/{client_ip}/json/"
        headers = {
            "User-Agent": "SPA-Job-Portal/1.0"
        }
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if data.get("error"):
                return schemas.IPLocationResponse(
                    city=None,
                    state=None,
                    country=None,
                    latitude=None,
                    longitude=None,
                )
            
            return schemas.IPLocationResponse(
                city=data.get("city"),
                state=data.get("region"),
                country=data.get("country_name"),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
            )
            
    except Exception as e:
        print(f"Error getting IP location: {e}")
        return schemas.IPLocationResponse(
            city=None,
            state=None,
            country=None,
            latitude=None,
            longitude=None,
        )


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

