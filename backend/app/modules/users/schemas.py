"""
User Pydantic schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.modules.users.models import UserRole


# Registration
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


# Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# User response (defined before Token to avoid forward reference)
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: UserRole
    profile_photo: Optional[str] = None
    resume_path: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    city_id: Optional[int] = None
    state_id: Optional[int] = None
    country_id: Optional[int] = None
    is_active: bool
    is_verified: bool
    managed_spa_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None

class LoginResponse(Token):
    message: str




# Update profile
class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    city_id: Optional[int] = None
    state_id: Optional[int] = None
    country_id: Optional[int] = None


# Admin user creation
class AdminUserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: Optional[UserRole] = UserRole.USER
    is_active: Optional[bool] = True
    is_verified: Optional[bool] = False
    bio: Optional[str] = None
    address: Optional[str] = None
    city_id: Optional[int] = None
    state_id: Optional[int] = None
    country_id: Optional[int] = None


# Admin user update (includes role and status)
class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    city_id: Optional[int] = None
    state_id: Optional[int] = None
    country_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    managed_spa_id: Optional[int] = None


# Change password
class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# Forgot password
class ForgotPassword(BaseModel):
    email: EmailStr


# Reset password
class ResetPassword(BaseModel):
    token: str
    new_password: str


# Permission schema
class PermissionResponse(BaseModel):
    id: int
    user_id: int
    can_post_jobs: bool
    can_post_free_jobs: bool
    can_post_premium_jobs: bool
    can_create_spa: bool
    can_edit_spa: bool
    can_manage_users: bool
    can_manage_all_jobs: bool
    can_manage_all_spas: bool
    
    class Config:
        from_attributes = True

