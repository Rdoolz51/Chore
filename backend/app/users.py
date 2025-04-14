# app/users.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
from .db import SessionLocal
from . import models
from .auth import SECRET_KEY, ALGORITHM, get_password_hash, get_current_user, create_access_token
from .schemas import SpouseCreate, InviteResponse, InvitedSpouseRegistration, ChildCreate, UserOut, Token
from .email_utils import fast_mail, MessageSchema

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/users/spouse/invite", response_model=InviteResponse)
def invite_spouse(
    invite: SpouseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    top_parent_id = current_user.id if current_user.parent_id is None else current_user.parent_id
    existing = db.query(models.User).filter(models.User.email == invite.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    payload = {
        "sub": invite.email,
        "role": "spouse",
        "parent_id": top_parent_id,
        "username": invite.username,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    # Update this URL with your frontend port; for example, if running on port 5173:
    invite_link = f"http://localhost:5173/auth?invite={token}"
    message = MessageSchema(
        subject="You’re invited to join the Chore Board!",
        recipients=[invite.email],
        body=f"Hi {invite.username},\n\nClick here to register: {invite_link}\n\n—ChoreBoard Team",
        subtype="plain",
    )
    background_tasks.add_task(fast_mail.send_message, message)

    return {"message": "Invitation sent!", "invite_link": invite_link}

@router.post("/auth/register-invite", response_model=Token)
def register_invited_spouse(invite_data: InvitedSpouseRegistration, token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        invite_email = payload.get("sub")
        invite_role = payload.get("role")
        parent_id = payload.get("parent_id")
        default_username = payload.get("username")
        if invite_email is None or invite_role != "spouse":
            raise HTTPException(status_code=400, detail="Invalid invitation token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid invitation token")

    existing = db.query(models.User).filter(models.User.email == invite_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    final_username = invite_data.username if invite_data.username else default_username
    hashed_pw = get_password_hash(invite_data.password)
    new_user = models.User(
        username=final_username,
        email=invite_email,
        hashed_password=hashed_pw,
        role="spouse",
        parent_id=parent_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate a fresh access token for this new spouse account.
    new_access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/users/child", response_model=UserOut)
def create_child(child: ChildCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    top_parent_id = current_user.id if current_user.parent_id is None else current_user.parent_id
    new_child = models.User(
        username=child.username,
        email=None,
        hashed_password=None,
        role="child",
        parent_id=top_parent_id
    )
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    return {"message": "Child created", "child": new_child}
