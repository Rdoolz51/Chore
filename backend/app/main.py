from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import SessionLocal, engine
from . import models, auth
from typing import List, Optional
from sqlalchemy import func, cast, Date, or_, and_
from datetime import datetime, date, time
from pydantic import BaseModel, EmailStr, ConfigDict
from .auth import auth_router, get_current_user
from .users import router as users_router
from .schemas import UserOut, ProfileResponse  # Import the UserOut schema for serializing user data
from fastapi_mail import MessageSchema
from .email_utils import fast_mail
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Chore endpoints (unchanged)
class ChoreCreate(BaseModel):
    title: str
    points: int
    assigned_to: str = "Unassigned"

class ChoreOut(BaseModel):
    id: int
    title: str
    points: int
    assigned_to: str
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

@app.post("/chores/", response_model=ChoreOut)
def create_chore(chore: ChoreCreate, db: Session = Depends(get_db)):
    db_chore = models.Chore(**chore.dict())
    db.add(db_chore)
    db.commit()
    db.refresh(db_chore)
    return db_chore

@app.get("/chores/", response_model=List[ChoreOut])
def get_chores(db: Session = Depends(get_db)):
    chores = db.query(models.Chore).filter(models.Chore.completed_at == None).all()
    return chores

@app.get("/scoreboard")
def get_scoreboard(date_param: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        target_date = datetime.strptime(date_param, "%Y-%m-%d").date() if date_param else date.today()
    except ValueError:
        target_date = date.today()
    start_dt = datetime.combine(target_date, time.min)
    end_dt = datetime.combine(target_date, time.max)
    chores_today = (
        db.query(models.Chore)
        .filter(models.Chore.completed_at != None)
        .filter(models.Chore.completed_at >= start_dt)
        .filter(models.Chore.completed_at <= end_dt)
        .all()
    )
    results = (
        db.query(
            models.Chore.assigned_to,
            func.sum(models.Chore.points).label("total_points")
        )
        .filter(models.Chore.completed_at != None)
        .group_by(models.Chore.assigned_to)
        .all()
    )
    scoreboard = []
    for row in results:
        username = row[0] or "Unassigned"
        total_pts = row[1] or 0
        scoreboard.append({"user": username, "points": total_pts})
    return {
        "scores": scoreboard,
        "todays_chores": chores_today,
        "selected_date": target_date.isoformat()
    }

@app.post("/chores/{chore_id}/complete")
def complete_chore(
    chore_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    chore = db.query(models.Chore).get(chore_id)
    if not chore:
        raise HTTPException(404, "Chore not found")

    chore.completed_at = datetime.now()
    db.commit()
    db.refresh(chore)

    # Who the chore was assigned to
    assigned_user = db.query(models.User).filter_by(username=chore.assigned_to).first()

    # Determine top parent
    top_parent_id = current_user.id if current_user.parent_id is None else current_user.parent_id

    # Query parent + spouse
    recipients = (
        db.query(models.User)
        .filter(
            or_(
                and_(models.User.role == "parent", models.User.id == top_parent_id),
                and_(models.User.role == "spouse", models.User.parent_id == top_parent_id),
            )
        )
        .all()
    )
    recipient_emails = [u.email for u in recipients if u.email]

    if recipient_emails:
        subject = "Chore Completed Notification"
        body_lines = [
            f"Chore: {chore.title}",
            f"Assigned to: {assigned_user.username if assigned_user else chore.assigned_to}",
            f"Completed by: {assigned_user.username}",
            f"Verified by: {current_user.username}",
            f"At: {chore.completed_at:%Y-%m-%d %H:%M}",
            "",
            "— Chore Board"
        ]
        body = "\n".join(body_lines)

        msg = MessageSchema(
            subject=subject,
            recipients=recipient_emails,
            body=body,
            subtype="plain",
        )
        background_tasks.add_task(fast_mail.send_message, msg)

    return {"message": "Chore completed successfully"}

# New Endpoint: GET /users/me for retrieving the current user’s profile, spouse, and children.
@app.get("/users/me", response_model=ProfileResponse)
def get_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If current_user.parent_id is None, then current_user is the parent.
    # Otherwise, current_user is a spouse (or child) and their parent's id is stored in current_user.parent_id.
    top_parent_id = current_user.id if current_user.parent_id is None else current_user.parent_id

    # Fetch the parent record; this will serve as the main profile information.
    parent = db.query(models.User).filter(models.User.id == top_parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found.")

    # Fetch the spouse for this family. Note that if a spouse logs in, they should be returned here.
    spouse = db.query(models.User).filter(
        models.User.parent_id == top_parent_id,
        models.User.role == "spouse"
    ).first()

    # Fetch children for this family.
    children = db.query(models.User).filter(
        models.User.parent_id == top_parent_id,
        models.User.role == "child"
    ).all()

    return ProfileResponse(user=parent, spouse=spouse, children=children)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router)

