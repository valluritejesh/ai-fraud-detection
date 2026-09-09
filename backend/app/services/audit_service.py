import uuid
import datetime
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import AuditLog

async def log_audit_event(
    db: AsyncSession,
    actor: str,
    action: str,
    resource_type: str,
    resource_id: str,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> AuditLog:
    log_entry = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10].upper()}",
        timestamp=datetime.datetime.utcnow(),
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_value=old_value,
        new_value=new_value,
        metadata_json=metadata or {}
    )
    db.add(log_entry)
    await db.flush()
    return log_entry
