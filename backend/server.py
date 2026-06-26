from fastapi import FastAPI, APIRouter, HTTPException, Response, Cookie, Header
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, date, timedelta

import requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
class TaskBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: str = ""
    priority: str = "medium"
    tags: List[str] = []
    due_time: Optional[str] = None
    estimated_minutes: int = 25
    recurring: bool = False
    timer_mode: str = "countdown"
    order: int = 0


class TaskCreate(TaskBase):
    pass


class Task(TaskBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    completed: bool = False
    elapsed_seconds: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    gcal_event_id: Optional[str] = None


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    due_time: Optional[str] = None
    estimated_minutes: Optional[int] = None
    recurring: Optional[bool] = None
    timer_mode: Optional[str] = None
    order: Optional[int] = None
    completed: Optional[bool] = None
    elapsed_seconds: Optional[int] = None
    completed_at: Optional[str] = None
    gcal_event_id: Optional[str] = None


class SessionLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    seconds: int
    mode: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SessionCreate(BaseModel):
    task_id: str
    seconds: int
    mode: str


class ShoppingItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    qty: str = "1"
    category: str = "general"
    purchased: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ShoppingCreate(BaseModel):
    name: str
    qty: str = "1"
    category: str = "general"


class ShoppingUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    qty: Optional[str] = None
    category: Optional[str] = None
    purchased: Optional[bool] = None


class MeTimeItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    duration_minutes: int = 5
    icon: str = "heart"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MeTimeCreate(BaseModel):
    title: str
    duration_minutes: int = 5
    icon: str = "heart"


class MeTimeUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    duration_minutes: Optional[int] = None
    icon: Optional[str] = None


# Monthly Goals (5 lists: goals, skills, books, movies, places)
ALLOWED_LIST_TYPES = {"goals", "skills", "books", "movies", "places"}


def current_month_key() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year:04d}-{now.month:02d}"


class MonthlyItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    list_type: str
    title: str
    checked: bool = False
    order: int = 0
    month_key: str = Field(default_factory=current_month_key)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MonthlyItemCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    list_type: str
    title: str
    month_key: Optional[str] = None


class MonthlyItemUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    checked: Optional[bool] = None
    order: Optional[int] = None
    month_key: Optional[str] = None


# Auth (Emergent-managed Google Auth)
class AuthSessionRequest(BaseModel):
    session_id: str


class AuthUser(BaseModel):
    user_id: str
    email: str
    name: str = ""
    picture: str = ""


# ---------------- Task routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Task Scheduler API"}


@api_router.get("/tasks", response_model=List[Task])
async def list_tasks():
    docs = await db.tasks.find({}, {"_id": 0}).sort("order", 1).to_list(2000)
    return [Task(**d) for d in docs]


@api_router.post("/tasks", response_model=Task)
async def create_task(payload: TaskCreate):
    task = Task(**payload.model_dump())
    await db.tasks.insert_one(task.model_dump())
    return task


@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        existing = await db.tasks.find_one({"id": task_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Task not found")
        return Task(**existing)
    result = await db.tasks.find_one_and_update(
        {"id": task_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(404, "Task not found")
    return Task(**result)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Task not found")
    return {"ok": True}


@api_router.post("/tasks/reorder")
async def reorder_tasks(payload: List[dict]):
    for item in payload:
        await db.tasks.update_one({"id": item["id"]}, {"$set": {"order": item["order"]}})
    return {"ok": True}


# ---------------- Sessions & Stats ----------------
@api_router.post("/sessions", response_model=SessionLog)
async def log_session(payload: SessionCreate):
    s = SessionLog(**payload.model_dump())
    await db.sessions.insert_one(s.model_dump())
    return s


@api_router.get("/stats")
async def get_stats():
    today_str = date.today().isoformat()
    all_tasks = await db.tasks.find({}, {"_id": 0}).to_list(2000)
    total = len(all_tasks)
    done = sum(1 for t in all_tasks if t.get("completed"))
    completion_pct = round((done / total) * 100) if total else 0
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(5000)
    today_seconds = sum(
        s.get("seconds", 0) for s in sessions if s.get("created_at", "").startswith(today_str)
    )
    return {
        "total_tasks": total,
        "completed_tasks": done,
        "completion_pct": completion_pct,
        "seconds_today": today_seconds,
        "total_sessions": len(sessions),
    }


# ---------------- Shopping list ----------------
@api_router.get("/shopping", response_model=List[ShoppingItem])
async def list_shopping():
    docs = await db.shopping.find({}, {"_id": 0}).to_list(2000)
    return [ShoppingItem(**d) for d in docs]


@api_router.post("/shopping", response_model=ShoppingItem)
async def create_shopping(payload: ShoppingCreate):
    item = ShoppingItem(**payload.model_dump())
    await db.shopping.insert_one(item.model_dump())
    return item


@api_router.put("/shopping/{item_id}", response_model=ShoppingItem)
async def update_shopping(item_id: str, payload: ShoppingUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        existing = await db.shopping.find_one({"id": item_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Item not found")
        return ShoppingItem(**existing)
    result = await db.shopping.find_one_and_update(
        {"id": item_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(404, "Item not found")
    return ShoppingItem(**result)


@api_router.delete("/shopping/{item_id}")
async def delete_shopping(item_id: str):
    res = await db.shopping.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"ok": True}


# ---------------- Me Time ----------------
DEFAULT_ME_TIME = [
    {"title": "Deep breathing", "duration_minutes": 3, "icon": "wind"},
    {"title": "Stretch break", "duration_minutes": 5, "icon": "activity"},
    {"title": "Tea ritual", "duration_minutes": 10, "icon": "coffee"},
    {"title": "Walk outside", "duration_minutes": 15, "icon": "footprints"},
    {"title": "Mindful pause", "duration_minutes": 5, "icon": "heart"},
]


async def _seed_me_time():
    count = await db.me_time.count_documents({})
    if count == 0:
        for item in DEFAULT_ME_TIME:
            obj = MeTimeItem(**item)
            await db.me_time.insert_one(obj.model_dump())


@api_router.get("/me-time", response_model=List[MeTimeItem])
async def list_me_time():
    await _seed_me_time()
    docs = await db.me_time.find({}, {"_id": 0}).to_list(500)
    return [MeTimeItem(**d) for d in docs]


@api_router.post("/me-time", response_model=MeTimeItem)
async def create_me_time(payload: MeTimeCreate):
    item = MeTimeItem(**payload.model_dump())
    await db.me_time.insert_one(item.model_dump())
    return item


@api_router.put("/me-time/{item_id}", response_model=MeTimeItem)
async def update_me_time(item_id: str, payload: MeTimeUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        existing = await db.me_time.find_one({"id": item_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Item not found")
        return MeTimeItem(**existing)
    result = await db.me_time.find_one_and_update(
        {"id": item_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(404, "Item not found")
    return MeTimeItem(**result)


@api_router.delete("/me-time/{item_id}")
async def delete_me_time(item_id: str):
    res = await db.me_time.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"ok": True}


# ---------------- Quote of the day (proxy ZenQuotes; cache 24h) ----------------
_QUOTE_CACHE = {"date": None, "data": None}


# ---------------- Monthly Goals ----------------
def _validate_list_type(lt: str):
    if lt not in ALLOWED_LIST_TYPES:
        raise HTTPException(400, f"Invalid list_type. Must be one of {sorted(ALLOWED_LIST_TYPES)}")


@api_router.get("/monthly-goals", response_model=List[MonthlyItem])
async def list_monthly(list_type: Optional[str] = None, month_key: Optional[str] = None):
    query = {}
    if list_type:
        _validate_list_type(list_type)
        query["list_type"] = list_type
    if month_key:
        query["month_key"] = month_key
    docs = await db.monthly_goals.find(query, {"_id": 0}).sort("order", 1).to_list(2000)
    out = []
    for d in docs:
        # Backfill month_key for legacy docs (defensive — also migrated on startup)
        if not d.get("month_key"):
            d["month_key"] = current_month_key()
        out.append(MonthlyItem(**d))
    return out


@api_router.get("/monthly-goals/months")
async def list_monthly_months():
    """Return the months that have any goal items, sorted desc (newest first)."""
    pipeline = [
        {"$group": {"_id": "$month_key", "count": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
    ]
    months = []
    async for row in db.monthly_goals.aggregate(pipeline):
        if row["_id"]:
            months.append({"month_key": row["_id"], "count": row["count"]})
    # Ensure current month is always present
    cur = current_month_key()
    if not any(m["month_key"] == cur for m in months):
        months.insert(0, {"month_key": cur, "count": 0})
    return months


@api_router.post("/monthly-goals", response_model=MonthlyItem)
async def create_monthly(payload: MonthlyItemCreate):
    _validate_list_type(payload.list_type)
    mkey = payload.month_key or current_month_key()
    count = await db.monthly_goals.count_documents(
        {"list_type": payload.list_type, "month_key": mkey}
    )
    item = MonthlyItem(
        list_type=payload.list_type, title=payload.title, order=count, month_key=mkey
    )
    await db.monthly_goals.insert_one(item.model_dump())
    return item


@api_router.put("/monthly-goals/{item_id}", response_model=MonthlyItem)
async def update_monthly(item_id: str, payload: MonthlyItemUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        existing = await db.monthly_goals.find_one({"id": item_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Item not found")
        return MonthlyItem(**existing)
    result = await db.monthly_goals.find_one_and_update(
        {"id": item_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(404, "Item not found")
    return MonthlyItem(**result)


@api_router.delete("/monthly-goals/{item_id}")
async def delete_monthly(item_id: str):
    res = await db.monthly_goals.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"ok": True}


@api_router.get("/quote/today")
async def quote_today():
    today_iso = date.today().isoformat()
    if _QUOTE_CACHE.get("date") == today_iso and _QUOTE_CACHE.get("data"):
        return _QUOTE_CACHE["data"]
    try:
        async with httpx.AsyncClient(timeout=6.0) as c:
            r = await c.get("https://zenquotes.io/api/today")
            arr = r.json()
        if isinstance(arr, list) and arr:
            data = {"text": arr[0].get("q", ""), "author": arr[0].get("a", "Unknown")}
        else:
            raise ValueError("bad response")
    except Exception as e:
        logging.warning(f"ZenQuotes failed: {e}")
        data = {
            "text": "Be so good they can't ignore you.",
            "author": "Steve Martin",
        }
    _QUOTE_CACHE["date"] = today_iso
    _QUOTE_CACHE["data"] = data
    return data


# ---------------- Auth (Emergent-managed Google Auth) ----------------
EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_COOKIE_NAME = "session_token"
SESSION_TTL_DAYS = 7


async def _resolve_user(
    session_token: Optional[str], authorization: Optional[str]
) -> Optional[dict]:
    """Read session_token from cookie, fallback to Authorization: Bearer. Returns user dict or None."""
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        try:
            expires_at = datetime.fromisoformat(expires_at)
        except Exception:
            return None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


@api_router.post("/auth/session")
async def auth_create_session(payload: AuthSessionRequest, response: Response):
    if not payload.session_id:
        raise HTTPException(400, "session_id required")
    # Exchange session_id with Emergent for user data + session_token
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(
                EMERGENT_AUTH_SESSION_URL,
                headers={"X-Session-ID": payload.session_id},
            )
    except Exception as e:
        logging.warning(f"emergent /session-data failed: {e}")
        raise HTTPException(502, "Auth provider unreachable")
    if r.status_code != 200:
        raise HTTPException(401, "Invalid or expired session_id")
    data = r.json()
    email = data.get("email")
    if not email:
        raise HTTPException(502, "Auth provider returned no email")

    # Upsert user (idempotent by email)
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", ""), "picture": data.get("picture", "")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one(
            {
                "user_id": user_id,
                "email": email,
                "name": data.get("name", ""),
                "picture": data.get("picture", ""),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    session_token = data.get("session_token") or f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    await db.user_sessions.insert_one(
        {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        path="/",
    )

    return {
        "user_id": user_id,
        "email": email,
        "name": data.get("name", ""),
        "picture": data.get("picture", ""),
    }


@api_router.get("/auth/me")
async def auth_me(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user = await _resolve_user(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture", ""),
    }


@api_router.post("/auth/logout")
async def auth_logout(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(
        key=SESSION_COOKIE_NAME, path="/", samesite="none", secure=True
    )
    return {"ok": True}


# ---------------- Google Calendar OAuth ----------------
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
BACKEND_BASE = os.environ.get("BACKEND_PUBLIC_URL", "")  # full https URL for OAuth redirect
FRONTEND_BASE = os.environ.get("FRONTEND_PUBLIC_URL", "")
REDIRECT_URI = f"{BACKEND_BASE}/api/oauth/calendar/callback"
SCOPES = ["https://www.googleapis.com/auth/calendar", "openid", "email", "profile"]


def _gcreds_configured() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and BACKEND_BASE)


@api_router.get("/google/status")
async def google_status(email: Optional[str] = None):
    if not _gcreds_configured():
        return {"configured": False, "connected": False}
    if not email:
        return {"configured": True, "connected": False}
    user = await db.gcal_users.find_one({"email": email}, {"_id": 0})
    return {"configured": True, "connected": bool(user and user.get("google_tokens"))}


@api_router.get("/oauth/calendar/login")
async def google_login():
    if not _gcreds_configured():
        raise HTTPException(503, "Google credentials not configured on server")
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    url, _state = flow.authorization_url(access_type="offline", prompt="consent", include_granted_scopes="true")
    return {"authorization_url": url}


@api_router.get("/oauth/calendar/callback")
async def google_callback(code: str):
    if not _gcreds_configured():
        raise HTTPException(503, "Google credentials not configured on server")
    token_resp = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=10,
    ).json()
    if "access_token" not in token_resp:
        raise HTTPException(400, f"Token exchange failed: {token_resp}")
    user = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {token_resp['access_token']}"},
        timeout=10,
    ).json()
    email = user.get("email")
    await db.gcal_users.update_one(
        {"email": email},
        {"$set": {"google_tokens": token_resp, "name": user.get("name", ""), "picture": user.get("picture", "")}},
        upsert=True,
    )
    target = FRONTEND_BASE or "/"
    return RedirectResponse(f"{target}?gcal_email={email}")


async def _get_creds(email: str) -> Credentials:
    rec = await db.gcal_users.find_one({"email": email})
    if not rec or "google_tokens" not in rec:
        raise HTTPException(401, "Google not connected")
    tokens = rec["google_tokens"]
    creds = Credentials(
        token=tokens.get("access_token"),
        refresh_token=tokens.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        await db.gcal_users.update_one(
            {"email": email}, {"$set": {"google_tokens.access_token": creds.token}}
        )
    return creds


@api_router.get("/calendar/events")
async def calendar_events(email: str):
    creds = await _get_creds(email)
    service = build("calendar", "v3", credentials=creds)
    now = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()
    res = service.events().list(
        calendarId="primary", timeMin=now, timeMax=end, maxResults=50, singleEvents=True, orderBy="startTime"
    ).execute()
    return {"items": res.get("items", [])}


class CalendarEventCreate(BaseModel):
    email: str
    task_id: str


@api_router.post("/calendar/push")
async def calendar_push(payload: CalendarEventCreate):
    task = await db.tasks.find_one({"id": payload.task_id}, {"_id": 0})
    if not task:
        raise HTTPException(404, "Task not found")
    creds = await _get_creds(payload.email)
    service = build("calendar", "v3", credentials=creds)

    today = date.today()
    hh, mm = (8, 0)
    if task.get("due_time"):
        try:
            hh, mm = [int(x) for x in task["due_time"].split(":")[:2]]
        except Exception:
            pass
    start_dt = datetime(today.year, today.month, today.day, hh, mm, tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(minutes=task.get("estimated_minutes") or 25)

    body = {
        "summary": task["title"],
        "description": task.get("description") or "From My Day app",
        "start": {"dateTime": start_dt.isoformat()},
        "end": {"dateTime": end_dt.isoformat()},
    }
    if task.get("gcal_event_id"):
        ev = service.events().update(calendarId="primary", eventId=task["gcal_event_id"], body=body).execute()
    else:
        ev = service.events().insert(calendarId="primary", body=body).execute()
        await db.tasks.update_one({"id": payload.task_id}, {"$set": {"gcal_event_id": ev.get("id")}})
    return {"ok": True, "event": ev}


@api_router.post("/google/disconnect")
async def google_disconnect(email: str):
    await db.gcal_users.delete_one({"email": email})
    return {"ok": True}


# ---------------- App wiring ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_migrations():
    """One-shot migrations on backend startup."""
    # Migrate legacy monthly_goals without month_key -> current month
    try:
        res = await db.monthly_goals.update_many(
            {"$or": [{"month_key": {"$exists": False}}, {"month_key": None}, {"month_key": ""}]},
            {"$set": {"month_key": current_month_key()}},
        )
        if res.modified_count:
            logging.info(
                f"[migration] backfilled month_key on {res.modified_count} monthly_goals items"
            )
    except Exception as e:
        logging.warning(f"[migration] monthly_goals month_key backfill failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
