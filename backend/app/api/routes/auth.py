"""
auth.py — /api/auth  (placeholder)

DementiaGlasses is designed as a single-user assistive device.
Authentication is therefore intentionally out-of-scope for the MVP.

If you need multi-user support in the future:
  1. Implement the User model in app/models/user.py
  2. Add JWT-based login/register endpoints here
  3. Apply a dependency `Depends(get_current_user)` to protected routes

For now this router exists so the import in main.py does not break if
someone adds `app.include_router(auth.router …)` later.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def auth_health():
    """Simple liveness check for the auth namespace."""
    return {"status": "auth_not_required"}
