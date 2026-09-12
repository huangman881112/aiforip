-- SQLite schema for suanfa backend
-- 表：algorithms（算法元数据）/ users（用户）/ progress（学习进度）/ notes（学习笔记）
--     comments（算法评论）/ training（算法训练刷题记录）

CREATE TABLE IF NOT EXISTS algorithms (
    id                 TEXT PRIMARY KEY,              -- 语义 id，如 'bubble-sort'
    name               TEXT NOT NULL,
    category           TEXT NOT NULL,                 -- sorting / searching / graph / dp / greedy
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

CREATE TABLE IF NOT EXISTS notes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    algorithm_id TEXT NOT NULL,
    content      TEXT NOT NULL,                          -- Markdown 正文，上限 20000 字符
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (algorithm_id) REFERENCES algorithms (id) ON DELETE CASCADE,
    UNIQUE (user_id, algorithm_id)
);

-- 算法评论（一个用户可对同一算法发多条评论）
CREATE TABLE IF NOT EXISTS comments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    algorithm_id TEXT NOT NULL,
    content      TEXT NOT NULL,                          -- 纯文本，上限 2000 字符
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (algorithm_id) REFERENCES algorithms (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_algorithm ON comments (algorithm_id, created_at);

-- 应用级运行时配置（如 AI 中转站 providers），value 为 JSON 文本；页面改配置后热生效，无需重启
CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 算法训练刷题记录（前端题库为静态数据，这里只存用户完成状态）
CREATE TABLE IF NOT EXISTS training (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    problem_id TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'solved',           -- solving / solved
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE (user_id, problem_id)
);
