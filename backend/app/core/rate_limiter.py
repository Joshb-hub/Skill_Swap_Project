import time
import asyncio
from typing import Tuple, Dict, Optional
import redis.asyncio as aioredis
from app.core.config import settings

# Thread-safe in-memory fallback store
_memory_attempts: Dict[str, list] = {}  # key -> list of float timestamps
_memory_lockouts: Dict[str, float] = {}  # key -> lockout expiry timestamp
_memory_lock = asyncio.Lock()


class RateLimitManager:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None
        self._redis_available: Optional[bool] = None

    async def _get_redis(self) -> Optional[aioredis.Redis]:
        if self._redis_available is False:
            return None
        if self._redis is None and settings.REDIS_URL:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=1.0,
                    socket_timeout=1.0,
                )
                await self._redis.ping()
                self._redis_available = True
            except Exception:
                self._redis_available = False
                self._redis = None
        return self._redis

    async def is_locked_out(self, identifier: str, ip_address: str) -> Tuple[bool, int]:
        """
        Check if the identifier or IP is locked out.
        Returns (is_locked, remaining_seconds).
        """
        keys = [f"lockout:id:{identifier.lower()}", f"lockout:ip:{ip_address}"]
        redis_client = await self._get_redis()
        now = time.time()

        if redis_client:
            try:
                for k in keys:
                    ttl = await redis_client.ttl(k)
                    if ttl > 0:
                        return True, ttl
                return False, 0
            except Exception:
                pass  # fallback to in-memory

        async with _memory_lock:
            for k in keys:
                expiry = _memory_lockouts.get(k, 0)
                if expiry > now:
                    return True, int(expiry - now)
                elif k in _memory_lockouts:
                    del _memory_lockouts[k]
            return False, 0

    async def record_failed_attempt(self, identifier: str, ip_address: str) -> Tuple[int, bool]:
        """
        Record a failed login attempt.
        If attempts exceed threshold (default 10), triggers lockout.
        Returns (current_attempts_count, is_now_locked).
        """
        id_key = f"attempts:id:{identifier.lower()}"
        ip_key = f"attempts:ip:{ip_address}"
        lockout_duration = settings.LOGIN_LOCKOUT_DURATION_MINUTES * 60
        max_attempts = settings.LOGIN_RATE_LIMIT_MAX_ATTEMPTS
        now = time.time()
        window = 15 * 60  # 15 minutes window

        redis_client = await self._get_redis()
        if redis_client:
            try:
                count = await redis_client.incr(id_key)
                if count == 1:
                    await redis_client.expire(id_key, window)
                await redis_client.incr(ip_key)
                await redis_client.expire(ip_key, window)

                if count >= max_attempts:
                    lock_key = f"lockout:id:{identifier.lower()}"
                    await redis_client.setex(lock_key, lockout_duration, "locked")
                    return count, True
                return count, False
            except Exception:
                pass

        # In-memory fallback
        async with _memory_lock:
            for key in [id_key, ip_key]:
                timestamps = _memory_attempts.get(key, [])
                # Filter out older than window
                timestamps = [t for t in timestamps if now - t < window]
                timestamps.append(now)
                _memory_attempts[key] = timestamps

            current_count = len(_memory_attempts[id_key])
            if current_count >= max_attempts:
                _memory_lockouts[f"lockout:id:{identifier.lower()}"] = now + lockout_duration
                _memory_lockouts[f"lockout:ip:{ip_address}"] = now + lockout_duration
                return current_count, True
            return current_count, False

    async def reset_failed_attempts(self, identifier: str, ip_address: str):
        """Reset failed attempts and lockouts after successful authentication."""
        keys = [
            f"attempts:id:{identifier.lower()}",
            f"attempts:ip:{ip_address}",
            f"lockout:id:{identifier.lower()}",
            f"lockout:ip:{ip_address}",
        ]
        redis_client = await self._get_redis()
        if redis_client:
            try:
                await redis_client.delete(*keys)
            except Exception:
                pass

        async with _memory_lock:
            for k in keys:
                _memory_attempts.pop(k, None)
                _memory_lockouts.pop(k, None)


rate_limiter = RateLimitManager()
