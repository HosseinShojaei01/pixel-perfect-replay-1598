"""Only reference images persist. Visitor uploads are bounded bytes in memory, never jobs/files."""
import asyncio
from collections import defaultdict, deque
from contextlib import asynccontextmanager
import hmac
import json
import os
from pathlib import Path
import sqlite3
import threading
import time
import uuid

import numpy as np
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from engine import MAX_BYTES, MODEL_ID, decode, embedding, scores, session, thumbnail

DATA = Path(os.environ.get("DATA_DIR", "/tmp/origindna-data"))
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / "references.sqlite3"
LOCK = threading.RLock()
CATEGORIES = {"lighting": ["Studio low-key", "Studio high-key", "Natural ambient", "Cinematic neon"], "pose": ["Front-facing", "Profile", "Three-quarter"], "style": ["Monochrome", "Editorial", "Casual"], "composition": ["Close-up", "Environmental", "Centered"]}

def connection():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def initialize():
    with connection() as conn:
        conn.executescript("CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, category TEXT NOT NULL, label TEXT NOT NULL, UNIQUE(category,label)); CREATE TABLE IF NOT EXISTS refs (id TEXT PRIMARY KEY, collection_id TEXT NOT NULL, image BLOB NOT NULL, vector BLOB NOT NULL, model TEXT NOT NULL);")

@asynccontextmanager
async def lifespan(app):
    if len(os.environ.get("ADMIN_TOKEN", "")) < 32:
        raise RuntimeError("Set ADMIN_TOKEN to a secure random token of at least 32 characters")
    initialize()
    await asyncio.to_thread(session)
    yield

app = FastAPI(title="OriginDNA Photographic Comparison", lifespan=lifespan)
origins = [x.strip() for x in os.environ.get("ALLOWED_ORIGINS", "http://localhost:8080").split(",") if x.strip()]
if "*" in origins:
    raise RuntimeError("Explicit ALLOWED_ORIGINS required")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST", "DELETE"], allow_headers=["Authorization", "Content-Type"])
visits = defaultdict(deque)
capacity = asyncio.Semaphore(2)

@app.middleware("http")
async def limits(request, call_next):
    # Do not trust forwarded-for supplied by clients. Configure trusted proxies at your host.
    if request.method != "OPTIONS":
        now = time.monotonic()
        key = request.client.host if request.client else "unknown"
        for stale in list(visits):
            if not visits[stale] or visits[stale][-1] < now - 60:
                visits.pop(stale, None)
        queue = visits[key]
        while queue and queue[0] < now - 60:
            queue.popleft()
        if len(queue) >= 60:
            return Response("Too many requests", status_code=429)
        queue.append(now)
        if request.method == "POST" and request.headers.get("content-length", "").isdigit() and int(request.headers["content-length"]) > MAX_BYTES + 65536:
            return Response("Request too large", status_code=413)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

def admin(request: Request):
    expected = os.environ.get("ADMIN_TOKEN", "")
    token = request.headers.get("authorization", "").removeprefix("Bearer ")
    if len(expected) < 32 or not hmac.compare_digest(token, expected):
        raise HTTPException(401, "Reference management requires an administrator token")

async def read_image(image: UploadFile):
    try:
        if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(415, "Use JPG, PNG or WEBP")
        raw = await image.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise HTTPException(413, "Maximum image size is 10 MB")
        try:
            return decode(raw)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
    finally:
        await image.close()

@app.get("/health")
def health():
    with connection() as conn:
        count = conn.execute("SELECT count(*) FROM refs WHERE model=?", (MODEL_ID,)).fetchone()[0]
    return {"status": "ready", "model": MODEL_ID, "reference_count": count, "categories": CATEGORIES}

@app.get("/references")
def references():
    with connection() as conn:
        collections = [dict(row) for row in conn.execute("SELECT * FROM collections ORDER BY category,label")]
        refs = [dict(row) for row in conn.execute("SELECT id,collection_id,model FROM refs ORDER BY id")]
    return {"collections": collections, "references": refs}

@app.get("/references/{reference_id}/image")
def reference_image(reference_id: str):
    with connection() as conn:
        row = conn.execute("SELECT image FROM refs WHERE id=?", (reference_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Reference not found")
    return Response(row[0], media_type="image/jpeg")

class Collection(BaseModel):
    category: str
    label: str

@app.post("/collections", dependencies=[Depends(admin)])
def create_collection(body: Collection):
    if body.label not in CATEGORIES.get(body.category, []):
        raise HTTPException(422, "Choose a supported non-sensitive photographic category")
    ident = uuid.uuid4().hex
    try:
        with LOCK, connection() as conn:
            conn.execute("INSERT INTO collections VALUES (?,?,?)", (ident, body.category, body.label))
    except sqlite3.IntegrityError as exc:
        raise HTTPException(409, "Collection already exists") from exc
    return {"id": ident}

@app.delete("/collections/{ident}", dependencies=[Depends(admin)])
def delete_collection(ident: str):
    with LOCK, connection() as conn:
        conn.execute("DELETE FROM refs WHERE collection_id=?", (ident,))
        cursor = conn.execute("DELETE FROM collections WHERE id=?", (ident,))
    if not cursor.rowcount:
        raise HTTPException(404, "Collection not found")
    return {"deleted": True}

@app.post("/references", dependencies=[Depends(admin)])
async def add_reference(image: UploadFile = File(...), collection_id: str = Form(...), rights_confirmed: bool = Form(False)):
    if not rights_confirmed:
        raise HTTPException(422, "Confirm permission to store and display this reference image")
    with connection() as conn:
        if not conn.execute("SELECT 1 FROM collections WHERE id=?", (collection_id,)).fetchone():
            raise HTTPException(404, "Collection not found")
        if conn.execute("SELECT count(*) FROM refs").fetchone()[0] >= 1000:
            raise HTTPException(409, "Reference limit reached (1000)")
    photo = await read_image(image)
    async with capacity:
        # Persist the sanitized, resized reference only; compute its vector from the same bytes.
        sanitized = thumbnail(photo)
        vector = await asyncio.to_thread(embedding, decode(sanitized))
    ident = uuid.uuid4().hex
    with LOCK, connection() as conn:
        if not conn.execute("SELECT 1 FROM collections WHERE id=?", (collection_id,)).fetchone():
            raise HTTPException(409, "Collection was deleted")
        conn.execute("INSERT INTO refs VALUES (?,?,?,?,?)", (ident, collection_id, sanitized, vector.tobytes(), MODEL_ID))
    return {"id": ident, "model": MODEL_ID, "dimensions": len(vector)}

@app.delete("/references/{ident}", dependencies=[Depends(admin)])
def delete_reference(ident: str):
    with LOCK, connection() as conn:
        cursor = conn.execute("DELETE FROM refs WHERE id=?", (ident,))
    if not cursor.rowcount:
        raise HTTPException(404, "Reference not found")
    return {"deleted": True}

@app.post("/rebuild", dependencies=[Depends(admin)])
async def rebuild():
    def run():
        with LOCK, connection() as conn:
            rows = conn.execute("SELECT id,image FROM refs").fetchall()
            for row in rows:
                conn.execute("UPDATE refs SET vector=?,model=? WHERE id=?", (embedding(decode(row["image"])).tobytes(), MODEL_ID, row["id"]))
        return len(rows)
    async with capacity:
        count = await asyncio.to_thread(run)
    return {"rebuilt": count, "model": MODEL_ID}

@app.post("/compare")
async def compare(image: UploadFile = File(...), consent: bool = Form(False)):
    if not consent:
        await image.close()
        raise HTTPException(422, "Explicit processing consent is required")
    photo = await read_image(image)
    with connection() as conn:
        rows = conn.execute("SELECT refs.id,vector,category,label FROM refs JOIN collections ON collection_id=collections.id WHERE model=? ORDER BY refs.id", (MODEL_ID,)).fetchall()
    if not rows:
        raise HTTPException(409, "No reference images. Ask the administrator to add licensed references first.")
    async def events():
        started = time.perf_counter()
        def event(data):
            return json.dumps(data) + "\n"
        yield event({"stage": "validated", "progress": 20})
        try:
            async with capacity:
                yield event({"stage": "embedding", "progress": 40})
                vector = await asyncio.to_thread(embedding, photo)
                yield event({"stage": "comparing", "progress": 75})
                values = await asyncio.to_thread(scores, vector, [np.frombuffer(row["vector"], dtype=np.float32) for row in rows])
            matches = [{"id": row["id"], "category": row["category"], "label": row["label"], "cosine": round(float(score), 6)} for row, score in zip(rows, values)]
            matches.sort(key=lambda row: (-row["cosine"], row["id"]))
            yield event({"stage": "complete", "progress": 100, "result": {"model": MODEL_ID, "reference_count": len(rows), "elapsed_ms": round((time.perf_counter() - started) * 1000), "matches": matches[:12]}})
        except Exception:
            # No exception strings or portrait data leak to responses/logs.
            yield event({"error": "Image comparison failed. Please retry or contact the administrator."})
        finally:
            photo.close()
    return StreamingResponse(events(), media_type="application/x-ndjson", headers={"X-Accel-Buffering": "no"})