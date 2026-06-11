"""
User API routes: authentication, profile, applications
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request, Header, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.modules.users import schemas, services, models
from app.modules.users.models import UserRole
from app.core.security import create_access_token
from app.core.config import settings
from datetime import timedelta
from app.modules.uploads.image_storage import save_image_file
from app.modules.uploads.cv_storage import save_cv_file
from app.modules.subscribe import models as subscribe_models
from app.modules.subscribe.models import SubscriptionFrequency
from app.modules.subscribe.utils import generate_unsubscribe_token

# Ensure all related models are imported to resolve SQLAlchemy relationships
# This ensures relationships in User model (to Spa, Job, etc.) can be properly configured
import app.modules.spas.models  # noqa: F401
import app.modules.jobs.models  # noqa: F401
import app.modules.locations.models  # noqa: F401
import app.modules.applications.models  # noqa: F401

router = APIRouter(prefix="/api/users", tags=["users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login", auto_error=False)


def get_current_user_optional(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """Get current authenticated user from JWT token, returns None if not authenticated"""
    from jose import jwt, JWTError
    
    # Try to get token from OAuth2PasswordBearer first
    if not token:
        # Fallback: extract from Authorization header directly
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current authenticated user from JWT token"""
    from jose import jwt, JWTError
    
    # Try to get token from OAuth2PasswordBearer first
    if not token:
        # Fallback: extract from Authorization header directly
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            # Debug: log what headers we received
            print(f"DEBUG: No token found. Authorization header: {auth_header}")
            print(f"DEBUG: All headers: {dict(request.headers)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated - no token provided",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - token is empty",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials - no user ID in token"
            )
        # Convert string back to integer
        try:
            user_id: int = int(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID in token"
            )
    except JWTError as e:
        print(f"DEBUG: JWT decode error: {str(e)}")
        print(f"DEBUG: Token received: {token[:50]}..." if token and len(token) > 50 else f"DEBUG: Token: {token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )
    
    user = services.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


def require_role(allowed_roles: list[UserRole]):
    """Dependency to require specific role(s)"""
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


# Authentication
@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: schemas.UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new user (default role: USER).
    Automatically subscribes user to job notifications.
    """
    # Check if email already exists
    if services.get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = services.create_user(db, user_data)
    
    # Auto-subscribe to job notifications
    try:
        existing_subscription = db.query(subscribe_models.JobSubscription).filter(
            subscribe_models.JobSubscription.email == user.email.lower()
        ).first()
        
        if not existing_subscription:
            subscription = subscribe_models.JobSubscription(
                email=user.email.lower(),
                name=user.name,
                frequency=SubscriptionFrequency.DAILY,
                user_id=user.id,
                unsubscribe_token=generate_unsubscribe_token(),
                is_active=True
            )
            db.add(subscription)
            db.commit()
            
            # Send welcome email in background
            from app.modules.subscribe.routes import send_welcome_email
            import asyncio
            def send_welcome_sync():
                asyncio.run(send_welcome_email(subscription.email, subscription.name, subscription.unsubscribe_token))
            background_tasks.add_task(send_welcome_sync)
    except Exception as e:
        # Don't fail registration if subscription fails
        print(f"[REGISTRATION] Failed to auto-subscribe user: {e}")
    
    return user


@router.post("/login", response_model=schemas.LoginResponse, response_model_exclude_none=True)
def login(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    user = services.authenticate_user(db, login_data.email, login_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }


# Profile Management
@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user


@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    profile_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    updated_user = services.update_user_profile(db, current_user.id, profile_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.post("/me/photo", response_model=schemas.UserResponse)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile photo"""
    photo_path = await save_image_file(photo, subfolder="profiles")
    updated_user = services.update_user_photo(db, current_user.id, photo_path)
    return updated_user


@router.post("/me/resume", response_model=schemas.UserResponse)
async def upload_resume(
    resume: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload resume/CV"""
    resume_path = await save_cv_file(resume)
    updated_user = services.update_user_resume(db, current_user.id, resume_path)
    return updated_user


@router.post("/me/change-password")
def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password (requires current password)"""
    success = services.change_password(
        db, current_user.id, password_data.current_password, password_data.new_password
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    return {"message": "Password changed successfully"}


# Password Reset (Forgot Password)
@router.post("/forgot-password")
async def forgot_password(
    forgot_data: schemas.ForgotPassword,
    db: Session = Depends(get_db)
):
    """
    Request password reset.
    Generates a reset token and sends it via email.
    """
    from app.modules.subscribe.email_service import send_email
    
    # Generate reset token
    token = services.generate_password_reset_token(db, forgot_data.email)
    
    if token:
        # Get user info for email personalization
        user = services.get_user_by_email(db, forgot_data.email)
        user_name = user.name if user else None
        
        # Generate email content
        html_content, text_content = services.generate_password_reset_email_html(token, user_name)
        
        # Send email
        email_sent = await send_email(
            to_email=forgot_data.email,
            subject="Password Reset Request - Work Spa Portal",
            html_content=html_content,
            text_content=text_content
        )
        
        if email_sent:
            return {
                "message": "If the email exists, a password reset link has been sent to your email."
            }
        else:
            # If SMTP not configured, still return success (email logged to console)
            return {
                "message": "If the email exists, a password reset link has been sent to your email."
            }
    else:
        # Don't reveal if email exists (security best practice)
        return {
            "message": "If the email exists, a password reset link has been sent."
        }


@router.post("/reset-password")
def reset_password(
    reset_data: schemas.ResetPassword,
    db: Session = Depends(get_db)
):
    """
    Reset password using reset token from forgot-password.
    Token is valid for 1 hour and can only be used once.
    """
    success = services.reset_password(db, reset_data.token, reset_data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    return {"message": "Password reset successfully"}


# Applications History
@router.get("/me/applications")
def get_my_applications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's job application history"""
    from app.modules.applications import schemas as app_schemas
    applications = services.get_user_applications(db, current_user.id)
    # Return applications (FastAPI will serialize them automatically, matching ApplicationResponse schema)
    return applications


# Permissions
@router.get("/me/permissions", response_model=schemas.PermissionResponse)
def get_my_permissions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's permissions"""
    permission = services.get_user_permissions(db, current_user.id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permissions not found")
    return permission


# Admin User Management
# Note: These routes must come AFTER /me routes to avoid conflicts
@router.get("/", response_model=List[schemas.UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    try:
        users = services.get_all_users(db, skip=skip, limit=limit)
        return users
    except Exception as e:
        import traceback
        error_msg = f"Error in get_all_users: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    current_user: models.User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    user = services.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: schemas.AdminUserCreate,
    current_user: models.User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    try:
        return services.create_user_by_admin(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_data: schemas.AdminUserUpdate,
    current_user: models.User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Update user (admin only - includes role and status)"""
    try:
        updated_user = services.update_user_by_admin(db, user_id, user_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    permanent: bool = False,
    current_user: models.User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    success = services.delete_user(db, user_id, permanent=permanent)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
