from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from .db import SessionLocal
from . import models
from .schemas import RegisterUser, LoginUser, Token

SECRET_KEY = "YOUR_SUPER_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@auth_router.post("/register", response_model=Token)
def register(user: RegisterUser, db: Session = Depends(get_db)):
    print("Registering user with email:", user.email)
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        print("Email already registered:", user.email)
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_pw = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pw,
        role="parent",
        parent_id=None
    )
    db.add(new_user)
    try:
        db.commit()
    except Exception as e:
        print("Error committing new user:", e)
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed due to a database error.")
    db.refresh(new_user)

    print("User registered, id:", new_user.id)
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/login", response_model=Token)
def login(user: LoginUser, db: Session = Depends(get_db)):
    print("Login attempt with email:", user.email)
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        print("No user found with that email.")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check for None in hashed_password
    if not db_user.hashed_password:
        print("User exists but has no hashed password!")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.hashed_password):
        print("Password verification failed.")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})
    print("Login successful, token created:", access_token)
    return {"access_token": access_token, "token_type": "bearer"}

