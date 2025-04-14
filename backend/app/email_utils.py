# app/email_utils.py
import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv

load_dotenv()  # loads SMTP_* from your .env

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USERNAME"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD"),
    MAIL_FROM=os.getenv("SMTP_FROM"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER=os.getenv("SMTP_SERVER"),
    MAIL_STARTTLS=True,      # renamed from MAIL_TLS
    MAIL_SSL_TLS=False,      # renamed from MAIL_SSL
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,     # optional, set False if using self‑signed certs
    TEMPLATE_FOLDER=None,    # optional
)

fast_mail = FastMail(conf)
