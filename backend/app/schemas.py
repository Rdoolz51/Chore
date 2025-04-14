from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List

# User response model
class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr] = None
    role: str
    parent_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# Auth Schemas
class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginUser(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Spouse invitation schemas
class SpouseCreate(BaseModel):
    username: str
    email: EmailStr

class InviteResponse(BaseModel):
    message: str
    invite_link: str

class InvitedSpouseRegistration(BaseModel):
    password: str
    username: Optional[str] = None

# Child creation schema
class ChildCreate(BaseModel):
    username: str

# New schema for the full profile (current user plus family)
class ProfileResponse(BaseModel):
    user: UserOut
    spouse: Optional[UserOut] = None
    children: List[UserOut] = []

    model_config = ConfigDict(from_attributes=True)
