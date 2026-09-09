import time
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import Claim, InvestigationCase, FraudSignal, AuditLog
from app.core.config import settings

router = APIRouter()
START_TIME = time.time()

@router.get("")
async def get_health_status(db: AsyncSession = Depends(get_db)):
    db_status = "HEALTHY"
    db_latency_ms = 0.0

    try:
        t0 = time.time()
        await db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000, 2)
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"

    # Query metrics
    claims_count = 0
    under_review_count = 0
    high_critical_count = 0
    total_signals = 0
    avg_risk_score = 0.0

    if db_status == "HEALTHY":
        c_res = await db.execute(select(func.count(Claim.id)))
        claims_count = c_res.scalar() or 0

        ur_res = await db.execute(select(func.count(Claim.id)).where(Claim.status.in_(["REVIEW_REQUIRED", "PROCESSING", "ANALYZING"])))
        under_review_count = ur_res.scalar() or 0

        hc_res = await db.execute(select(func.count(Claim.id)).where(Claim.risk_level.in_(["HIGH", "CRITICAL"])))
        high_critical_count = hc_res.scalar() or 0

        sig_res = await db.execute(select(func.count(FraudSignal.id)))
        total_signals = sig_res.scalar() or 0

        avg_res = await db.execute(select(func.avg(Claim.risk_score)))
        avg_risk_score = round(float(avg_res.scalar() or 0.0), 1)

    uptime_seconds = round(time.time() - START_TIME, 1)

    return {
        "status": "OPERATIONAL" if db_status == "HEALTHY" else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms
        },
        "agents": {
            "document_agent": "ACTIVE",
            "vision_agent": "ACTIVE",
            "historical_pattern_agent": "ACTIVE",
            "rules_engine": "ACTIVE",
            "verification_agent": "ACTIVE",
            "fraud_risk_engine": "ACTIVE"
        },
        "metrics": {
            "total_claims": claims_count,
            "claims_under_review": under_review_count,
            "high_critical_risk_claims": high_critical_count,
            "total_fraud_signals_generated": total_signals,
            "average_risk_score": avg_risk_score
        }
    }
