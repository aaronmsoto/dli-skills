-- Conjuga beacon schema (M28). Counts and unlinkable tokens ONLY —
-- never IPs, user agents, cookies, or any identifier (signed amendment).
CREATE TABLE IF NOT EXISTS counters (
  date  TEXT NOT NULL,
  page  TEXT NOT NULL,
  event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, page, event)
);

-- One salt per window ('day'/'month'); rotation OVERWRITES the value,
-- permanently severing stored hashes from any input.
CREATE TABLE IF NOT EXISTS salts (
  window TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  value  TEXT NOT NULL
);

-- Rotating-salt unique-device tokens (see worker.js header).
CREATE TABLE IF NOT EXISTS uniques (
  window TEXT NOT NULL,
  period TEXT NOT NULL,
  hash   TEXT NOT NULL,
  PRIMARY KEY (window, period, hash)
);
