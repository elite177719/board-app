const FAIL_THRESHOLD = 5;
const LOCK_DURATIONS = [60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000];

const attempts = new Map();

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function getState(username) {
  const key = normalizeUsername(username);
  return attempts.get(key) || { fails: 0, lockedUntil: 0, lockLevel: 0 };
}

function getLockStatus(username) {
  const key = normalizeUsername(username);
  const state = getState(key);
  const now = Date.now();

  if (state.lockedUntil > now) {
    return {
      username: key,
      locked: true,
      retryAfter: Math.ceil((state.lockedUntil - now) / 1000),
      lockedUntil: state.lockedUntil,
      lockLevel: state.lockLevel,
      fails: state.fails,
    };
  }

  return {
    username: key,
    locked: false,
    retryAfter: 0,
    lockedUntil: 0,
    lockLevel: state.lockLevel,
    fails: state.fails,
  };
}

function isLocked(username) {
  const key = normalizeUsername(username);
  const state = getState(key);
  const now = Date.now();

  if (state.lockedUntil > now) {
    return {
      locked: true,
      retryAfter: Math.ceil((state.lockedUntil - now) / 1000),
    };
  }

  if (state.lockedUntil && state.lockedUntil <= now) {
    state.lockedUntil = 0;
    attempts.set(key, state);
  }

  return { locked: false };
}

function recordFailure(username) {
  const key = normalizeUsername(username);
  const state = getState(key);

  state.fails += 1;
  if (state.fails >= FAIL_THRESHOLD) {
    const duration = LOCK_DURATIONS[Math.min(state.lockLevel, LOCK_DURATIONS.length - 1)];
    state.lockedUntil = Date.now() + duration;
    state.lockLevel += 1;
    state.fails = 0;
  }

  attempts.set(key, state);
}

function recordSuccess(username) {
  const key = normalizeUsername(username);
  attempts.delete(key);
}

function unlock(username, options = {}) {
  const { resetLevel = true } = options;
  const key = normalizeUsername(username);
  const state = getState(key);

  if (resetLevel) {
    attempts.delete(key);
    return;
  }

  state.lockedUntil = 0;
  state.fails = 0;
  attempts.set(key, state);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, state] of attempts.entries()) {
    if (!state.lockedUntil && state.fails === 0) {
      attempts.delete(key);
      continue;
    }
    if (state.lockedUntil && state.lockedUntil <= now && state.fails === 0) {
      attempts.delete(key);
    }
  }
}, 10 * 60 * 1000).unref?.();

module.exports = { isLocked, recordFailure, recordSuccess, getLockStatus, unlock };