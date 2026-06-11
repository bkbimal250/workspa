"""
SPA API routes
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.core.database import get_db
from app.modules.spas import schemas, services
from app.modules.users.routes import get_current_user
from app.modules.users.models import User, UserRole
from app.modules.uploads.image_storage import save_image_file
from app.modules.analytics import trackers

router = APIRouter(prefix="/api/spas", tags=["spas"])


@router.get("/", response_model=List[schemas.SpaResponse])
def get_spas(
    skip: int = 0,
    limit: int = 1000,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get SPAs (requires authentication)
    
    - Recruiters: Returns empty list (use /recruiter/my-spa instead)
    - Managers: Returns all SPAs (same access as admins)
    - Admins: Returns all SPAs
    """
    # Recruiters should use the /recruiter/my-spa endpoint instead
    if current_user.role == UserRole.RECRUITER:
        return []
    
    # Managers and Admins see all SPAs (equal access)
    if current_user.role in [UserRole.MANAGER, UserRole.ADMIN]:
        return services.get_spas(db, skip=skip, limit=limit, is_active=is_active, created_by=None)
    
    # Default: return all SPAs (for other roles if any)
    return services.get_spas(db, skip=skip, limit=limit, is_active=is_active, created_by=None)


@router.get("/near-me", response_model=List[schemas.SpaResponse])
def get_spas_near_me(
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    db: Session = Depends(get_db)
):
    """Get SPAs near a location"""
    # Validate radius_km
    if radius_km < 0 or radius_km > 1000:
        raise HTTPException(status_code=400, detail="radius_km must be between 0 and 1000")
    return services.get_spas_near_location(db, latitude, longitude, radius_km)


@router.get("/public", response_model=List[schemas.SpaResponse])
def get_public_spas(
    skip: int = 0,
    limit: int = Query(100, ge=1, le=1000),
    city_id: Optional[int] = None,
    area_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Get active SPAs for public SEO pages and sitemap generation."""
    from app.modules.spas.models import Spa

    query = db.query(Spa).filter(Spa.is_active == True)
    if city_id is not None:
        query = query.filter(Spa.city_id == city_id)
    if area_id is not None:
        query = query.filter(Spa.area_id == area_id)

    return query.order_by(Spa.updated_at.desc()).offset(skip).limit(limit).all()


@router.get("/slug/{slug}", response_model=schemas.SpaResponse)
def get_spa_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get SPA by slug"""
    spa = services.get_spa_by_slug(db, slug)
    if not spa:
        raise HTTPException(status_code=404, detail="SPA not found")
    return spa


# Recruiter-specific endpoints - MUST come before /{spa_id} route
@router.get("/recruiter/my-spa", response_model=schemas.SpaResponse)
def get_my_spa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the recruiter's managed SPA"""
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters can access this endpoint")
    
    spa = services.get_recruiter_spa(db, current_user.id)
    if not spa:
        raise HTTPException(status_code=404, detail="You don't have a managed SPA yet. Create one first.")
    
    return spa


@router.get("/{spa_id}", response_model=schemas.SpaResponse)
def get_spa_by_id(spa_id: int, db: Session = Depends(get_db)):
    """Get SPA by ID"""
    spa = services.get_spa_by_id(db, spa_id)
    if not spa:
        raise HTTPException(status_code=404, detail="SPA not found")
    return spa


@router.post("/{spa_id}/track-booking-click")
def track_spa_booking_click(
    spa_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Track a booking URL click for a SPA.
    - Increments Spa.booking_click_count
    - Logs an analytics event 'spa_booking_click'
    """
    spa = services.get_spa_by_id(db, spa_id)
    if not spa:
        raise HTTPException(status_code=404, detail="SPA not found")

    updated_spa = services.increment_spa_booking_click(db, spa_id)

    # Log analytics event (best-effort)
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        trackers.track_event(
            db=db,
            event_type="spa_booking_click",
            spa_id=spa_id,
            city=None,
            latitude=spa.latitude,
            longitude=spa.longitude,
            user_agent=user_agent,
            ip_address=client_ip,
        )
    except Exception:
        # Analytics should not affect main behaviour
        pass

    return {"status": "tracked", "booking_click_count": updated_spa.booking_click_count if updated_spa else 0}


@router.post("/", response_model=schemas.SpaResponse, status_code=201)
async def create_spa(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    phone: str = Form(...),
    email: str = Form(...),
    address: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    directions: Optional[str] = Form(None),
    opening_hours: Optional[str] = Form(None),
    closing_hours: Optional[str] = Form(None),
    booking_url_website: Optional[str] = Form(None),
    country_id: int = Form(...),
    state_id: int = Form(...),
    city_id: int = Form(...),
    area_id: Optional[int] = Form(None),
    postalCode: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    rating: Optional[float] = Form(None),
    reviews: Optional[float] = Form(None),
    logo_image: Optional[UploadFile] = File(None),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new SPA (admin/manager/recruiter)"""
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Recruiters can only create one SPA
    is_recruiter = current_user.role == UserRole.RECRUITER
    if is_recruiter and current_user.managed_spa_id is not None:
        raise HTTPException(status_code=400, detail="Recruiter can only manage one SPA. Please update your existing SPA instead.")
    
    # Save logo image
    logo_image_path = None
    if logo_image:
        try:
            logo_image_path = await save_image_file(logo_image, subfolder="spas")
        except Exception as e:
            print(f"Error saving logo image: {e}")
    
    # Save uploaded images
    spa_images = []
    if images:
        for image in images:
            try:
                image_path = await save_image_file(image, subfolder="spas")
                spa_images.append(image_path)
            except Exception as e:
                print(f"Error saving image: {e}")
    
    # Convert empty strings to None for optional fields
    def clean_optional(value):
        return None if value == '' or value is None else value
    
    # Convert area_id to int if provided
    area_id_int = None
    if area_id is not None:
        try:
            area_id_int = int(area_id) if str(area_id).strip() else None
        except (ValueError, TypeError):
            area_id_int = None
    
    # Convert numeric fields
    latitude_val = None
    if latitude is not None:
        try:
            latitude_val = float(latitude) if str(latitude).strip() else None
        except (ValueError, TypeError):
            latitude_val = None
    
    longitude_val = None
    if longitude is not None:
        try:
            longitude_val = float(longitude) if str(longitude).strip() else None
        except (ValueError, TypeError):
            longitude_val = None
    
    # Convert rating and reviews
    rating_val = None
    if rating is not None:
        try:
            rating_val = float(rating) if str(rating).strip() else 0.0
        except (ValueError, TypeError):
            rating_val = 0.0
    
    reviews_val = None
    if reviews is not None:
        try:
            reviews_val = float(reviews) if str(reviews).strip() else 0.0
        except (ValueError, TypeError):
            reviews_val = 0.0
    
    spa_data = schemas.SpaCreate(
        name=name,
        description=clean_optional(description),
        phone=phone,
        email=email,
        logo_image=logo_image_path,
        address=clean_optional(address),
        website=clean_optional(website),
        directions=clean_optional(directions),
        opening_hours=clean_optional(opening_hours),
        closing_hours=clean_optional(closing_hours),
        booking_url_website=clean_optional(booking_url_website),
        country_id=country_id,
        state_id=state_id,
        city_id=city_id,
        area_id=area_id_int,
        postalCode=clean_optional(postalCode),
        latitude=latitude_val,
        longitude=longitude_val,
        spa_images=spa_images if spa_images else None,
        rating=rating_val if rating_val is not None else 0.0,
        reviews=reviews_val if reviews_val is not None else 0.0
    )
    
    is_recruiter = current_user.role == UserRole.RECRUITER
    try:
        spa = services.create_spa(db, spa_data, current_user.id, is_recruiter=is_recruiter)
        return spa
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{spa_id}", response_model=schemas.SpaResponse)
async def update_spa(
    spa_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    directions: Optional[str] = Form(None),
    opening_hours: Optional[str] = Form(None),
    closing_hours: Optional[str] = Form(None),
    booking_url_website: Optional[str] = Form(None),
    country_id: Optional[int] = Form(None),
    state_id: Optional[int] = Form(None),
    city_id: Optional[int] = Form(None),
    area_id: Optional[int] = Form(None),
    postalCode: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    rating: Optional[float] = Form(None),
    reviews: Optional[float] = Form(None),
    is_active: Optional[bool] = Form(None),
    is_verified: Optional[bool] = Form(None),
    existing_images: Optional[str] = Form(None),  # JSON string of existing image paths to keep
    logo_image: Optional[UploadFile] = File(None),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a SPA (admin/manager/recruiter - recruiters can only update their own)"""
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get existing spa
    spa = services.get_spa_by_id(db, spa_id)
    if not spa:
        raise HTTPException(status_code=404, detail="SPA not found")
    
    # Recruiters can only update their own SPA
    if current_user.role == UserRole.RECRUITER:
        if current_user.managed_spa_id != spa_id:
            raise HTTPException(status_code=403, detail="You can only update your own SPA")
    
    # Handle logo image upload
    logo_image_path = spa.logo_image  # Keep existing if not updated
    if logo_image:
        try:
            logo_image_path = await save_image_file(logo_image, subfolder="spas")
        except Exception as e:
            print(f"Error saving logo image: {e}")
    
    # Handle image uploads
    # If existing_images is provided (even as empty string or empty array), use that list
    # If not provided at all, keep all existing images
    if existing_images is not None and existing_images != '':
        # Parse existing images to keep from JSON string
        try:
            existing_images_list = json.loads(existing_images)
            if not isinstance(existing_images_list, list):
                existing_images_list = []
        except (json.JSONDecodeError, TypeError):
            # If parsing fails, start with existing images
            existing_images_list = list(spa.spa_images) if spa.spa_images else []
        spa_images = existing_images_list.copy()
    else:
        # If existing_images not provided, keep all existing images
        spa_images = list(spa.spa_images) if spa.spa_images else []
    
    # Add new uploaded images
    if images:
        for image in images:
            try:
                image_path = await save_image_file(image, subfolder="spas")
                spa_images.append(image_path)
            except Exception as e:
                print(f"Error saving image: {e}")
    
    # Convert empty strings to None for optional fields
    def clean_optional(value):
        return None if value == '' or value is None else value
    
    # Convert area_id to int if provided
    area_id_int = None
    if area_id is not None:
        try:
            area_id_int = int(area_id) if str(area_id).strip() else None
        except (ValueError, TypeError):
            area_id_int = None
    
    # Convert numeric fields
    latitude_val = None
    if latitude is not None:
        try:
            latitude_val = float(latitude) if str(latitude).strip() else None
        except (ValueError, TypeError):
            latitude_val = None
    
    longitude_val = None
    if longitude is not None:
        try:
            longitude_val = float(longitude) if str(longitude).strip() else None
        except (ValueError, TypeError):
            longitude_val = None
    
    # Convert rating and reviews
    rating_val = None
    if rating is not None:
        try:
            rating_val = float(rating) if str(rating).strip() else None
        except (ValueError, TypeError):
            rating_val = None
    
    reviews_val = None
    if reviews is not None:
        try:
            reviews_val = float(reviews) if str(reviews).strip() else None
        except (ValueError, TypeError):
            reviews_val = None
    
    # Build update data - only include fields that are provided (not None)
    # Empty strings are converted to None to clear optional fields
    update_dict = {}
    if name is not None:
        update_dict['name'] = clean_optional(name)
    if description is not None:
        update_dict['description'] = clean_optional(description)
    if phone is not None:
        update_dict['phone'] = clean_optional(phone)
    if email is not None:
        update_dict['email'] = clean_optional(email)
    if logo_image_path is not None:
        update_dict['logo_image'] = logo_image_path
    if address is not None:
        update_dict['address'] = clean_optional(address)
    if website is not None:
        update_dict['website'] = clean_optional(website)
    if directions is not None:
        update_dict['directions'] = clean_optional(directions)
    if opening_hours is not None:
        update_dict['opening_hours'] = clean_optional(opening_hours)
    if closing_hours is not None:
        update_dict['closing_hours'] = clean_optional(closing_hours)
    if booking_url_website is not None:
        update_dict['booking_url_website'] = clean_optional(booking_url_website)
    if country_id is not None:
        update_dict['country_id'] = country_id
    if state_id is not None:
        update_dict['state_id'] = state_id
    if city_id is not None:
        update_dict['city_id'] = city_id
    if area_id is not None:
        update_dict['area_id'] = area_id_int
    if postalCode is not None:
        update_dict['postalCode'] = clean_optional(postalCode)
    if latitude is not None:
        update_dict['latitude'] = latitude_val
    if longitude is not None:
        update_dict['longitude'] = longitude_val
    if rating is not None:
        update_dict['rating'] = rating_val
    if reviews is not None:
        update_dict['reviews'] = reviews_val
    if spa_images is not None:
        update_dict['spa_images'] = spa_images
    if is_active is not None:
        update_dict['is_active'] = is_active
    if is_verified is not None:
        update_dict['is_verified'] = is_verified
    
    # Include spa_images if we processed images (even if empty list means remove all)
    if existing_images is not None or images:
        update_dict['spa_images'] = spa_images if spa_images else None
    
    # Build update data schema
    update_data = schemas.SpaUpdate(**update_dict)
    
    updated_spa = services.update_spa(db, spa_id, update_data, current_user.id)
    return updated_spa


@router.delete("/{spa_id}")
def delete_spa(
    spa_id: int,
    permanent: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a SPA (admin only).
    
    - permanent=True: Permanently delete from database
    - permanent=False: Soft delete (set is_active=False)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete SPAs")
    
    success = services.delete_spa(db, spa_id, permanent=permanent)
    if not success:
        raise HTTPException(status_code=404, detail="SPA not found")
    
    message = "SPA permanently deleted" if permanent else "SPA deleted successfully"
    return {"message": message}

