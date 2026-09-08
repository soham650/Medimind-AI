import time
from collections import defaultdict
from typing import Dict, List

class InMemoryRateLimiter:
    """
    Sliding window rate limiter for report analysis endpoints.
    Protects compute and AI quota against abuse.
    """
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds
        
        # Clean older timestamps
        self.requests[client_id] = [t for t in self.requests[client_id] if t > window_start]
        
        if len(self.requests[client_id]) >= self.max_requests:
            return False

        self.requests[client_id].append(now)
        return True

    def reset(self):
        self.requests.clear()
