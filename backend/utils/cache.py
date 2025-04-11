# utils/cache.py
import time

_cache_store = {}

def set_cache(key, value, ttl_seconds=3600):
    _cache_store[key] = (value, time.time() + ttl_seconds)

def get_cache(key):
    data = _cache_store.get(key)
    if data:
        value, expiry = data
        if time.time() < expiry:
            return value
        else:
            del _cache_store[key]
    return None
