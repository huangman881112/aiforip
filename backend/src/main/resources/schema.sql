-- SQLite schema for suanfa backend
-- 三张表：algorithms（算法元数据）/ users（用户）/ progress（学习进度）

CREATE TABLE IF NOT EXISTS algorithms (
    id                 TEXT PRIMARY KEY,              -- 语义 id，如 'bubble-sort'
    name               TEXT NOT NULL,
    category           TEXT NOT NULL,                 -- sorting / searching / graph
    sub_category       TEXT,
    difficulty         TEXT,
    stability          TEXT,
    description        TEXT,
    complexity         TEXT,
    route              TEXT,
    complexity_details TEXT                           -- JSON 字符串（time[]/space/stability/difficulty/extras）
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS progress (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    algorithm_id TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'learning',    -- learning / learned / favorited
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (algorithm_id) REFERENCES algorithms (id) ON DELETE CASCADE,
    UNIQUE (user_id, algorithm_id)
);
