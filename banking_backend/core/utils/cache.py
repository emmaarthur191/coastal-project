import logging
import time
from django.core.cache.backends.base import BaseCache
from django.core.cache.backends.redis import RedisCache
from django.core.cache.backends.locmem import LocMemCache

logger = logging.getLogger(__name__)

class FallbackRedisCache(BaseCache):
    """
    A Redis cache backend that falls back to LocMemCache if Redis is down.
    Ensures the application (like login rate limits) continues to function safely.
    Periodically retries the Redis connection to recover automatically.
    """
    def __init__(self, server, params):
        super().__init__(params)
        self._server = server
        self._params = params
        # Initialize primary Redis cache
        self._redis_cache = RedisCache(server, params)
        # Initialize fallback LocMemCache
        locmem_params = params.copy()
        self._locmem_cache = LocMemCache("fallback-locmem", locmem_params)
        self._fallback_active = False
        self._last_redis_check = 0
        self._check_interval = 30  # seconds

    def _call_safe(self, method_name, *args, **kwargs):
        now = time.time()
        
        # If in fallback mode, periodically check if Redis has recovered
        if self._fallback_active and (now - self._last_redis_check >= self._check_interval):
            try:
                # Attempt a simple lightweight check
                self._redis_cache.has_key("_redis_health_ping_")
                self._fallback_active = False
                logger.info("REDIS CACHE RECOVERY: Redis connection re-established, switching back to primary.")
            except Exception:
                self._last_redis_check = now
                logger.debug("REDIS CACHE RETRY: Redis still down, continuing with LocMemCache fallback.")

        if not self._fallback_active:
            try:
                method = getattr(self._redis_cache, method_name)
                return method(*args, **kwargs)
            except Exception as e:
                logger.error(
                    f"REDIS CACHE FAILURE: Failed to execute {method_name} on Redis. "
                    f"Falling back to LocMemCache. Error: {e}"
                )
                self._fallback_active = True
                self._last_redis_check = now
        
        # Execute on fallback cache
        try:
            method = getattr(self._locmem_cache, method_name)
            return method(*args, **kwargs)
        except Exception as e:
            logger.critical(f"FALLBACK CACHE FAILURE: LocMemCache failed: {e}", exc_info=True)
            raise e

    def add(self, key, value, timeout=None, version=None):
        return self._call_safe("add", key, value, timeout=timeout, version=version)

    def get(self, key, default=None, version=None):
        return self._call_safe("get", key, default=default, version=version)

    def set(self, key, value, timeout=None, version=None):
        return self._call_safe("set", key, value, timeout=timeout, version=version)

    def touch(self, key, timeout=None, version=None):
        return self._call_safe("touch", key, timeout=timeout, version=version)

    def delete(self, key, version=None):
        return self._call_safe("delete", key, version=version)

    def get_many(self, keys, version=None):
        return self._call_safe("get_many", keys, version=version)

    def set_many(self, data, timeout=None, version=None):
        return self._call_safe("set_many", data, timeout=timeout, version=version)

    def delete_many(self, keys, version=None):
        return self._call_safe("delete_many", keys, version=version)

    def clear(self):
        return self._call_safe("clear")

    def validate_key(self, key):
        return self._redis_cache.validate_key(key)

    def incr(self, key, delta=1, version=None):
        return self._call_safe("incr", key, delta=delta, version=version)

    def decr(self, key, delta=1, version=None):
        return self._call_safe("decr", key, delta=delta, version=version)

    def has_key(self, key, version=None):
        return self._call_safe("has_key", key, version=version)
