function createRateLimiter({ windowMs, max, keyFn, message }) {
  const buckets = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, Math.max(windowMs, 60_000)).unref?.();

  return function rateLimiter(req, res, next) {
    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        message: message || '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
      });
    }

    next();
  };
}

module.exports = { createRateLimiter };