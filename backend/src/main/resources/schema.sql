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
    email         TEXT,                                -- 绑定邮箱（修改密码时用验证码确认；可为空）
    role          TEXT NOT NULL DEFAULT 'user',         -- admin / user（管理员在「用户管理」界面授予）
    membership_expire_at TEXT,                          -- 会员到期时间（UTC；NULL = 从未开通），老库由 DataInitializer 补列
    display_name  TEXT,                                -- 个人中心·名称（展示昵称，留空用用户名）
    gender        TEXT,                                -- male / female / other（NULL = 未填）
    age           INTEGER,                             -- 6 ~ 120
    city          TEXT,                                -- 城市（≤ 50 字）
    occupation    TEXT,                                -- 职业（≤ 50 字）
    learning_goal TEXT,                                -- 学习目的（≤ 200 字）
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

-- 页面笔记（全站每个页面均可添加的速记便签：按「页面路由路径 + 用户」归属，右侧笔记面板用）
CREATE TABLE IF NOT EXISTS page_notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    page_path  TEXT NOT NULL,                          -- 当前页面菜单路径对应的路由（页面唯一标识，如 /algorithms/sorting）
    menu_path  TEXT,                                   -- 菜单路径展示名（如「算法 / 排序算法」，创建时快照）
    user_id    INTEGER NOT NULL,                       -- 用户（笔记归属者，关联 users.id）
    content    TEXT NOT NULL,                          -- 笔记内容，上限 20000 字符
    creator    TEXT NOT NULL,                          -- 创建人（用户名快照，改名后仍可追溯）
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_page_notes_user_page ON page_notes (user_id, page_path, created_at);

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

-- ============ 会员 / 支付 / 订单 ============

-- 会员套餐（价格以「分」存整数，避免浮点误差；features 为 JSON 数组字符串）
CREATE TABLE IF NOT EXISTS membership_plans (
    id                   TEXT PRIMARY KEY,               -- 语义 id：monthly / quarterly / yearly
    name                 TEXT NOT NULL,
    price_cents          INTEGER NOT NULL,
    original_price_cents INTEGER,                        -- 划线原价（可空）
    duration_days        INTEGER NOT NULL,
    description          TEXT,
    features             TEXT,                           -- JSON 数组，如 ["AI 提问额度 3 倍", ...]
    sort_order           INTEGER NOT NULL DEFAULT 0,
    active               INTEGER NOT NULL DEFAULT 1
);

-- 订单（plan_name / amount / membership_days 为下单时快照，改套餐不影响历史订单）
CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no        TEXT NOT NULL UNIQUE,                 -- SF + 时间戳 + 随机数
    user_id         INTEGER NOT NULL,
    plan_id         TEXT NOT NULL,
    plan_name       TEXT NOT NULL,
    amount_cents    INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',      -- pending/paid/cancelled/expired/refunded
    pay_channel     TEXT NOT NULL DEFAULT 'mock',         -- mock/alipay/wechat
    trade_no        TEXT,                                 -- 渠道流水号（沙箱支付时生成 MOCK 前缀号）
    paid_at         TEXT,
    expires_at      TEXT NOT NULL,                        -- 待支付过期时间（UTC，超时未付置 expired）
    membership_days INTEGER NOT NULL DEFAULT 0,           -- 支付成功后为用户延长多少天会员
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status, created_at);

-- users 表的会员到期时间（UTC 'YYYY-MM-DD HH:MM:SS'；NULL = 从未开通）。
-- 老库由 DataInitializer 补列；续费在原到期时间上顺延，未过期不清零。
-- （新库建表时带该列；CREATE TABLE IF NOT EXISTS 对旧库不生效，故这里只描述结构）
