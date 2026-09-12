# 小白学算法（suanfa_vue）

一个基于 Vue 3 的算法学习与训练网站，用交互式动画演示算法的执行过程。网站覆盖**排序、搜索、图算法、动态规划、贪心算法**五大类共 39 个算法，每个算法都有独立的可视化详情页，可以逐步观察元素比较、交换、图遍历，以及 DP 表如何被一格一格填满、贪心在每一步做了什么选择。

除算法可视化外，还提供：

- **算法训练**（`/training`）：14 道经典题，覆盖题面/示例/分级提示/参考解答，可标记练习中与已通过。
- **学习日历**（`/calendar`）：按月热力展示学习活跃，统计连续学习天数。
- **AI 算法助教**（`/ai`）：SSE 流式打字机输出，带站内资料召回（轻量 RAG）、多模型故障转移与限流；后端未配置时自动降级为本地资料答疑。
- **评论区**：算法详情页内与同学交流学习心得。
- **学习进度 / 笔记**：跨设备记录（需后端）。

## 技术栈

- Vue 3（Composition API，`<script setup>` 语法）
- Vite 7（开发服务器与构建工具）
- Vue Router 4（前端路由）
- Pinia（登录态管理）
- 后端：Spring Boot（进度/笔记/评论/训练/日历/AI 代理 API，可选，未部署时前端自动降级为本地数据）

## 运行方式

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建，产物输出到 dist 目录
npm run build

# 本地预览构建产物
npm run preview
```

## 算法覆盖

共 39 个算法可视化详情，分为五大类。顶部「算法」下拉子菜单与分类页一一对应
（清单由 `src/data/algorithms.js` 的 `algorithmCategories` 派生，新增分类不必改导航）。

### 排序算法（10 个）

冒泡排序、选择排序、插入排序、希尔排序、归并排序、快速排序、堆排序、计数排序、桶排序、基数排序。

### 搜索算法（6 个）

线性搜索、二分搜索、插值搜索、跳跃搜索、指数搜索、哈希搜索。

### 图算法（11 个）

广度优先搜索（BFS）、深度优先搜索（DFS）、Dijkstra 最短路径、Bellman-Ford 最短路径、Floyd-Warshall 多源最短路径、A* 寻路、Prim 最小生成树、Kruskal 最小生成树、拓扑排序、Ford-Fulkerson 最大流、Edmonds-Karp 最大流。

### 动态规划（8 个）

| 子分类 | 算法 |
| --- | --- |
| 线性DP | 爬楼梯、最大子数组和（Kadane）、最长递增子序列（LIS） |
| 背包问题 | 0/1 背包、完全背包 |
| 字符串DP | 最长公共子序列（LCS）、编辑距离 |
| 区间DP | 矩阵链乘 |

`dp_algorithms/DpTableViz.vue` 是一个**通用 DP 表播放器**：边界值/转移/依赖格/回溯路径分色显示，
支持播放、单步前进回退、调速、改输入与随机数据。题目不写死在组件里，而是由
`src/data/dpProblems.js` 的求解器产出统一的 `frames`（`{r, c, value, depends, text, kind}`）序列。

### 贪心算法（4 个）

活动选择问题（区间贪心）、分数背包（背包贪心）、哈夫曼编码（编码贪心）、贪心找零（构造贪心，兼作「贪心何时失效」的反例）。

`greedy_algorithms/GreedyViz.vue` 按题目 `kind` 分别画甘特时间轴 / 背包容量条 / 找零进度，
`HuffmanViz.vue` 额外渲染合并后的哈夫曼树与编码表；步骤同样来自 `src/data/greedyProblems.js`。

> 这两类共 12 条记录的站内文案，由仓库里的 `scripts/gen-dp-greedy.py` 一次性同时写入
> `src/data/algorithms.js`、`backend/.../seed/algorithms.json`、`backend/.../seed/algorithms-content.json`
> （按 id 去重，可重复执行），避免三处各写一遍互相漂移。生成结果就是最终数据，日常改文案直接改文件即可。

## 目录结构

```
suanfa_vue/
├── index.html                    # 入口 HTML
├── package.json                  # 依赖与脚本配置
├── vite.config.js                # Vite 配置
└── src/
    ├── main.js                   # 应用入口
    ├── App.vue                   # 根组件（顶部导航 + 页脚）
    ├── style.css                 # 全局基础样式
    ├── styles/
    │   └── theme.css             # 全站配色 Design Tokens（深色主题）
    ├── assets/                   # 静态资源
    ├── data/
    │   ├── algorithms.js         # 算法元数据单一数据源（离线兵底 + 分类表）
│   ├── dpProblems.js         # 动态规划题目求解器：产出逐步 frame 序列
│   ├── greedyProblems.js     # 贪心题目求解器：产出逐步决策 frame 序列
    │   └── trainingProblems.js   # 算法训练题库（静态）
    ├── api/
    │   └── client.js             # 后端 API 客户端（后端优先，失败降级本地数据）
    ├── stores/
    │   └── user.js               # 登录态 store
    ├── router/
    │   └── index.js              # 路由配置
    └── components/
        ├── common/               # 首页、关于、登录、注册、修改密码、用户管理（仅管理员）、进度、学习日历、训练、AI 助教、评论等通用组件
        └── algorithms/
            ├── algo-viz-common.css      # 可视化区公共外观（DP / 贪心共用）
            ├── sorting_algorithms/     # 排序：SortingPage 分类页 + 10 个 *Detail.vue 详情组件
            ├── searching_algorithms/   # 搜索：SearchingPage 分类页 + 6 个 *Detail.vue 详情组件
            ├── graph_algorithms/       # 图：GraphPage 分类页 + 11 个 *Detail.vue 详情组件
            ├── dp_algorithms/          # 动态规划：DPPage 分类页 + DpTableViz 通用 DP 表播放器
            └── greedy_algorithms/      # 贪心：GreedyPage 分类页 + GreedyViz / HuffmanViz
```

每个分类目录下都有一个分类页组件（SortingPage、SearchingPage、GraphPage），负责展示算法列表。分类页内部通过 `selectedAlgorithm` 状态条件挂载当前选中的算法详情组件，各详情路径在路由表中平铺注册，可直接访问。

## 主题配色（深色）

全站配色集中在 `src/styles/theme.css` 的 `:root` 中以 CSS 变量（Design Token）形式维护，页面背景、卡片表面、文字、边框、语义色、导航栏、页脚都只引用变量，不写具体色值。

| 变量分组 | 代表变量 | 用途 |
| --- | --- | --- |
| 页面画布 | `--app-bg` `--app-bg-2` `--surface-muted` `--surface` `--surface-2` `--code-bg` | 由深到浅的五层底色，依次用于 body、页面容器、区块、卡片、控件、代码块 |
| 文字 | `--text-1` `--text-2` `--text-3` `--text-on-brand` `--text-on-bright` | 正文 / 次要 / 辅助，以及品牌色块、亮黄高亮块上的文字 |
| 边框 | `--border-1` `--border-2` | 常规描边与强调描边 |
| 语义色 | `--c-blue` `--c-green` `--c-red` `--c-orange` `--c-amber` `--c-purple` `--c-cyan` `--c-pink` | 深底上提亮后的强调文字 / 图标 |
| 色块 | `--tint-blue` `--tint-green` … 及对应 `-border` | 半透明淡彩底，替代浅色主题的 `#e3f2fd`、`#e8f5e9` 等 |
| 导航栏 | `--nav-*` | 顶栏、Logo、下拉菜单、登录区 |
| 页脚 | `--footer-*` | 页脚底色与文字 |

- 新增样式时请引用上述变量；深色主题下不要再写 `#fff`、`#f8fafc`、`#333` 这类硬编码值。
- 若要提供「浅色模式」开关，只需在 `html` 上追加一组变量覆盖（例如 `html[data-theme='light'] { --app-bg: #f5f7fa; --surface: #ffffff; ... }`），组件样式无需改动。
- 历史代码的一次性迁移脚本保留在 `scripts/dark_theme_codemod.py`，只改写 `<style>` 块与组件同目录的 `.css`，并会跳过 `linear-gradient()`、`rgba()` 与语义强调色。

## 账号安全：修改密码（邮箱验证码）

**入口**：登录成功后，顶部导航右侧出现**用户名下拉子菜单**（`管理员` 标签按后端身份判定下发，见下节），点开展开后选择「修改密码」，进入 `/account/password`（`meta.requiresAuth`，未登录会被守卫踢到 `/login?redirect=...`）。

**流程**（邮箱验证码为二次校验，防「会话被劫持后静默改密」）：

1. 填收件邮箱（已绑定过会自动带出 `users.email`，没绑定过则首次绑定）→ 点「发送验证码」；
2. 填 6 位验证码 + 原密码 + 新密码（≥ 6 位，且不得与原密码相同，两次一致）→「确认修改」；
3. 后端依次校验：原密码 → 验证码（一次性消费，错 5 次作废）→ 更新 BCrypt 哈希并绑定邮箱，前端刷新 store 中的用户信息。

限流：同一「用户 + 邮箱 + 用途」60 秒内只能发一次，验证码 10 分钟有效；验证码只存在进程内（单实例部署，重启即作废）。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/email-code` | 需登录。`{email}` → `{sent, mailConfigured, maskedEmail, expiresInSeconds, cooldownSeconds, devCode?}`；`devCode` 仅在后端未配 SMTP 时返回 |
| PUT | `/api/auth/password` | 需登录。`{email, code, oldPassword, newPassword}` → 最新 `UserResponse`（含 `email`、`admin`） |
| GET | `/api/auth/me` | 增加返回 `email`（可为空）、`role` 与 `admin`（是否管理员），前端据此渲染子菜单与预填邮箱 |

**SMTP 配置**（环境变量，见 `backend/.env.example`）：`MAIL_HOST` / `MAIL_PORT`（默认 465）/ `MAIL_USERNAME` / `MAIL_PASSWORD`（QQ、163 要填 SMTP 授权码）/ `MAIL_FROM` / `MAIL_SSL`。`MAIL_HOST` 留空即**开发模式**：不发邮件，验证码写后端日志并随响应回传，前端自动填入，页面上有黄色提示条；生产环境配好 host 并把 `MAIL_DEV_ECHO_CODE=false` 关掉回传即可。

## 用户管理（仅管理员）

**入口**：顶部导航「用户名下拉子菜单 → 管理员 → 用户管理」，路由 `/admin/users`
（`meta.requiresAuth + meta.requiresAdmin`；非管理员直访会被守卫弹回首页，后端整组接口同样 401/403 兼底）。

**页面能力**（`UserManagePage.vue`）：

- 列表带每个账号的学习数据统计（进度 / 笔记 / 评论 / 刷题条数），可按用户名、邮箱搜索；
- 新建用户（用户名 + 初始密码 + 可选邮箱 + 可选角色）、编辑用户名 / 绑定邮箱、授予或取消 `admin` 角色；
- 重置密码（不需要原密码与邮箱验证码，走 `PUT /api/auth/password` 之外的管理员通道）；
- 删除账号（二次确认：需手打用户名，并提示将一并清除的学习数据）。

**管理员身份有两个来源**（判定收口在 `AdminGuard`，任一命中即为管理员）：

| 来源 | 谁改 | 说明 |
| --- | --- | --- |
| `users.role = 'admin'` | 本页（或 `PUT /api/admin/users/{id}`） | 常规方式，可增可删 |
| `suanfa.ai.admin-usernames`（`AI_ADMIN_USERNAMES`，默认 `admin`） | 后端配置 | 配置级兼底：老库升级后仍能进门；这类账号在本页**不能改名 / 删除 / 调角色**，页面上有「配置白名单」标记 |

自我保护规则（后端硬拦，前端同步置灰按钮）：不能删除或降级**当前登录账号**；不能把全场管理员数量降为 0；
用户名 / 邮箱全局唯一（邮箱置空 = 解绑）；用户名 2-32 位、密码 ≥ 4 位（与注册页一致）。

> 旧库自动迁移：`DataInitializer` 会 `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`（与新库 schema 幂等共存）。
> 白名单账号的 `admin` 身份本来就与 `role` 无关，回填只是为了让页面显示与实际权限一致。
> 想完全走页面管控：把 `AI_ADMIN_USERNAMES` 置空（就没有白名单兼底了，请确认页面上至少留着一个 `role=admin` 的账号）。

### 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/users?keyword=` | `{total, users:[{id, username, email, role, admin, whitelisted, createdAt, progressCount, noteCount, commentCount, trainingCount}]}` |
| POST | `/api/admin/users` | `{username, password, email?, role?}` → 新行；重名 / 参数不合法 400 |
| PUT | `/api/admin/users/{id}` | `{username?, email?, role?}`（字段为 `null`/不传 = 不改；`email:""` = 解绑） |
| PUT | `/api/admin/users/{id}/password` | `{password}` → `{message}`；重置后该账号下次登录用新密码 |
| DELETE | `/api/admin/users/{id}` | 删用户并显式清理其 progress / notes / comments / training（SQLite 连接默认不开外键级联） |

## AI 算法助教

### 架构

```
浏览器 AiChatPage.vue ──POST /api/ai/chat/stream──> Spring Boot AiController
        （SSE 打字机渲染）                                  │
                                                          ├─ AiKnowledgeService  站内资料召回（Mongo algorithm_content，回退 seed JSON）
                                                          └─ AiChatService       代理上游 /v1/chat/completions（SSE）
```

- **流式**：`meta`（站内引用）→ `delta`* → `done` / `error`，前端增量渲染，可随时停止（AbortController）。
- **知识增强**：按问题召回 Top-3 算法资料（中英别名 + 缩写打分），连同站内算法清单注入 system prompt，
  回答与详情页文案、复杂度表一致，并返回 `refs` 渲染成可点击的「站内参考」标签。
- **故障转移 + 熔断**：主模型限流/额度用尽/超时时自动依次尝试后面的备用模型（可属于不同中转站）；
  失败模型进入熔断（额度类 5min、鉴权/路由不存在 15min、5xx 1min），期间不再重复撞坏模型。
- **多中转站**：上游按 provider（中转站）分组，每个 provider 有独立 `base-url` / `api-key` /
  额外请求头，模型可单独设 `maxTokens` / `timeoutSeconds` / `temperature` / `reasoningEffort`。
- **对话页不选模型，而且模型名只对管理员可见**：顶栏只有一个只读徽章——
  管理员看「默认模型 X · 中转站Y」（后端 `defaultModel`，即 `primary` 置顶后的首个可用模型），
  回答后换成「本次模型 X」，默认模型被熔断而降级时气泡上另有提示；
  **普通用户只看「AI 服务 · 供应商名」**（模型名、预算、降级提示一律不可见）。
  管理员改默认模型的位置：**⚙️ 中转站配置 → 某中转站的模型表格 → 设为默认**。
- **降级链按角色裁剪**：普通用户只会用到管理员开放给他们的模型（`user-visible`，默认开）；
  未登录不下发清单，也拿不到默认模型名，详见下面的[「谁能用哪些模型」](#%e8%b0%81%e8%83%bd%e7%94%a8%e5%93%aa%e4%ba%9b%e6%a8%a1%e5%9e%8b%e7%ae%a1%e7%90%86%e5%91%98-vs-%e6%99%ae%e9%80%9a%e7%94%a8%e6%88%b7)。
- **限流**：`AI_RATE_PER_MINUTE`（默认每人每分钟 12 次），超出返回 429 与可读提示。
- **降级矩阵**：未登录/后端未配 key/后端离线 → 本地答疑（站内资料检索 + 模板，含多算法对比表）；限流/上游异常 → 错误气泡 + 一键重试。

### 接入 API 中转站

中转站按**模型名前缀**路由上游，因此 `AI_MODEL` 填中转站的模型名而不是厂商原名。

```bash
# 1) 配置密钥（backend/.env 已 gitignore）
cp backend/.env.example backend/.env   # 修改 AI_API_KEY

# 2) 启动后端（脚本自动加载 .env）
scripts/dev-backend.sh                 # http://localhost:8080

# 3) 自检
curl -s http://localhost:8080/api/ai/status
```

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `AI_BASE_URL` | `http://192.168.1.8:8000/v1` | 中转站 OpenAI 兼容入口 |
| `AI_API_KEY` | 空 | 中转站 token；为空时接口返回 503，前端走本地答疑 |
| `AI_MODEL` | `deepseek-chat` | 主模型（走 DeepSeek 官方额度） |
| `AI_FALLBACK_MODELS` | `qwen3.5:9b@6000@150@low` | 备用模型列表（逗号分隔），单项支持 `name@maxTokens@timeoutSeconds@reasoningEffort`；本地思考型模型需大预算 + 压低推理 |
| `AI_TIMEOUT_SECONDS` | `90` | 单次上游调用超时 |
| `AI_MAX_TOKENS` | `1200` | 回答长度上限（控制额度消耗） |
| `AI_TEMPERATURE` | `0.4` | 算法讲解建议 0.2~0.5 |
| `AI_KNOWLEDGE` | `true` | 关闭则不注入站内资料 |
| `AI_RATE_PER_MINUTE` | `12` | 每人每分钟限额，<=0 关闭 |

只接一个中转站时，上面这张表就够了（`AI_MODEL` 为主模型，`AI_FALLBACK_MODELS` 为降级链）。

### 多个中转站 / 每个模型单独配置

需要「A 站主用 + B 站兜底 + 本机 llama.cpp 最后兜底」时，用 `providers` 声明多个上游。两种写法等价，`providers-json` 优先级更高：

**1）环境变量（写在 `backend/.env`，不用改 yml）**

```bash
AI_PROVIDERS_JSON='[
  {"id":"relay-a","label":"中转站 A","baseUrl":"http://192.168.1.8:8000/v1","apiKey":"sk-xxx",
   "headers":{"X-Title":"suanfa-ai"},
   "models":[{"name":"deepseek-chat","label":"DeepSeek Chat","primary":true,"maxTokens":1200},
             {"name":"kimi-k2","label":"Kimi K2（月度限额）","maxTokens":1500}]},
  {"id":"local","label":"本机 llama.cpp","baseUrl":"http://127.0.0.1:8080/v1","requireKey":false,
   "models":[{"name":"qwen3.5:9b","label":"Qwen3.5 9B（本地兜底）","maxTokens":6000,"timeoutSeconds":150,"reasoningEffort":"low"}]}]'
```

**2）`application.yml` 的 `suanfa.ai.providers`**（同构对象，字段写成 kebab-case：`base-url` / `api-key` / `require-key` / `max-tokens` / `timeout-seconds` / `reasoning-effort`）

| 字段（provider） | 说明 |
| --- | --- |
| `id` / `label` | 上游唯一标识 / 前端展示名；模型重名时前端用 `provider/id` 定位 |
| `base-url` / `api-key` | 该中转站的 OpenAI 兼容入口与 token；`api-key` 缺省且 `require-key: true` 时继承全局 `AI_API_KEY` |
| `enabled` / `require-key` | 临时停用某站；本地自建上游置 `false`（不鉴权，也不继承全局 token） |
| `headers` | 额外请求头（部分聚合站要求 `X-Title` 之类；`Authorization`/`Content-Type`/`Accept` 仍由服务统一设置） |
| `max-tokens` / `timeout-seconds` / `temperature` | provider 级默认预算，模型未设时继承（再缺省继承全局） |

| 字段（model） | 说明 |
| --- | --- |
| `name` | 中转站的**路由名**（常与厂商名不同），必填 |
| `label` | 前端下拉展示名，默认等于 `name` |
| `primary` | 设为默认模型（置顶，前端预选） |
| `enabled` | 置 `false` 保留配置但不下拉展示（对所有人生效，同名环境变量模型也会被一并屏蔽） |
| `user-visible` | 置 `false` = **仅管理员可选**：普通用户下拉里没有，也不会被他们的「自动」降级选中；模型本身仍可用 |
| `max-tokens` / `timeout-seconds` / `temperature` / `reasoning-effort` | 单模型预算；思考型本地模型需 `max-tokens>=5000` + `reasoning-effort: low`，否则常只出 reasoning 没有答案 |
| `note` | 备注，`/api/ai/status` 原样回传，用于标注「月度限额」「本地慢」等 |

### 谁能用哪些模型（管理员 vs 普通用户）

管理员 = `users.role='admin'` 或命中 `AI_ADMIN_USERNAMES`（默认 `admin`）白名单，见「用户管理」一节。模型可见性由**管理员逐模型勾选**：

| 能力 | 管理员 | 普通用户 | 未登录 |
| --- | --- | --- | --- |
| 顶栏徽章 | 真实默认模型名（`默认模型 X · 中转站Y`，tooltip 带预算/熔断详情） | **只见供应商**：`AI 服务 · 中转站名`，拿不到供应商名时只写 `AI 服务已接入` | **不展示**：接口不下发清单（`loginRequired: true`），顶栏只有「🔒 登录解锁自由对话」 |
| 看到真实模型名（清单 / 回答回传的 `model`） | 可以 | **否**：后端已脱敏——`name`/`label` 换成中转站名、`token` 换成 `provider:<id>`、预算/温度/熔断置空、`providers[].models` 为空数组、同站只聚合一项，`note` 与 `unavailableReason` 也不下发 | 无清单 |
| 降级链 | 全部模型 | 只在开放的模型里降级（降级结果对用户不可见） | 无（不走上游模型，对话直接降级为本地答疑） |
| 用接口指定 `model`（页面已无此入口，留给排障/脚本） | 可以 | 未开放的模型后端返回 `400`（不扣限流额度）；把自己拿到的 `provider:<id>` 回传会被当作「自动选择」 | `401` |
| `GET /api/ai/upstream-models`（上游真实清单） | 可以 | `403` | `401` |
| ⚙️ 中转站配置 / 测试连接（`/api/ai/settings*`） | 可以 | `403`（前端也会隐藏入口） | `401` |

> ⚠️ **中转站展示名别填成模型名**：脱敏是以「供应商名」为准的，若某个中转站的 `label` 恰好等于它自己某个模型名
> （label 留空时就会回落到模型名），脱敏会连供应商名一起退回兜底文案 `AI 服务`。想让徽章好看，
> 去 **⚙️ 中转站配置** 给中转站起个中性展示名（如「内网中转站」）。

- 未登录不下发模型清单，也不下发上游 `baseUrl`（都属于「站内接了哪些中转站/模型」的信息）；
  游客照旧能用 AI 助教页（本地答疑），登录后前端 `watch(userStore.isLoggedIn)` 会重新拉自己那一份状态。
- 勾选位置：**AI 助教 → ⚙️ 中转站配置 → 某中转站的模型表格 → 「对用户开放」**，取消勾选即 `user-visible: false`。
- 默认值是「开放」，因此旧的 `.env` / yml / 页面配置行为不变；想让某个模型只给自己用，勾掉它即可。
- 与 `enabled` 的区别：`enabled=false` 是彻底屏蔽（管理员也不能用，且会屏蔽同名环境变量模型）；
  `user-visible=false` 只是不对外开放，管理员自己仍可随时调用。
- 环境变量 / yml 里同样可写：`AI_PROVIDERS_JSON` 用 `"userVisible":false`，`suanfa.ai.providers` 用 `user-visible: false`。
- 旧写法（`AI_MODEL` / `AI_FALLBACK_MODELS`）没有字段位，默认全部开放；要隐藏就在页面上新建**同名 provider（id 用 `default`）+ 同名模型**
  并取消「对用户开放」——同名条目以页面配置为准，无需改 `.env` 重启。
- 可见性判定全在**服务端**（`AiChatService` 的 `usableModels(privileged)` / `findModel(token, privileged)`，
  下发前的脱敏在 `AiController.visibleModels` / `visibleModel`），前端只是被动渲染后端下发的清单，
  手改请求里的 `model` 也绕不过去；徽章再挡一层（`canManage` 才拼模型名），兼作旧版后端兼容。

配置校对与联调：

```bash
# 1) 看服务端解析结果（provider/预算/是否可用/不可用原因）
curl -s localhost:8080/api/ai/status | jq '.modelDetails[] | {token, available, maxTokens}'

# 2) 问中转站真实存在哪些模型名（仅管理员；服务代用它的 token 调上游 GET /models）
curl -s -b cookie.txt 'localhost:8080/api/ai/upstream-models?provider=relay-a' | jq

# 3) 本地没有中转站时可用内置 mock 联调（两个端口当两个站）
node scripts/mock-openai-relay.mjs 9099 & AI_BASE_URL=http://127.0.0.1:9099/v1 AI_API_KEY=sk-test scripts/dev-backend.sh
```

> 降级语义：请求体 `model` 为空时按「`primary` 置顶 → 其余声明顺序」依次尝试；指定模型时把它排到第一位，
> 失败（熔断/超时/401）后仍会继续尝试后面的模型，已开吐文字则不切换（避免内容混排）。
> 熔断键为 `provider/name`，因此两个站有同名模型时互不拖累。

可用模型查询（中转站管理接口，用同一个 token）：

```bash
curl -s -H "Authorization: Bearer $AI_API_KEY" \
  http://192.168.1.8:8000/admin/api/opencode/models | jq -r '.models[] | select(.enabled) | .id'
```

> 注：中转站的聚合类模型（kimi/glm/minimax/mimo 等）受 OpenCode 月度额度限制，额度用尽后会返回 429；
> 兜底的本地模型（llama.cpp 上的 qwen3.5:9b）会先生成上万字的 reasoning_content，max_tokens 低于 ~5000 时常只剩思考没有答案；
> 因此它单独配了 `@6000@150@low`（预算/超时/reasoning_effort）。主模型不受影响，仍是 1200。
> 此时助教会熔断该模型并回落到 `AI_FALLBACK_MODELS`，前端顶栏仍显示实际服务模型名，便于排查。

### 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/ai/status` | `configured` / `models` / `modelDetails` / `defaultModel` / `providers` / `ratePerMinute` / `canManage` / `loginRequired`，前端据此渲染顶栏徽章与降级提示；`modelDetails` 按身份裁剪：**未登录为空**、**普通用户只拿到脱敏后的供应商条目**（不含模型名），管理员拿全量 |
| GET | `/api/ai/models` | 只要模型清单（聊天页已不用，留给排障脚本；同样按身份裁剪与脱敏，未登录为空） |
| GET | `/api/ai/upstream-models` | 代理各中转站的 `GET /models`，校对真实模型名（仅管理员） |
| POST | `/api/ai/chat` | 一次性返回 `{reply, model, refs}`；请求体可选 `model`（name 或 `provider/name`） |
| POST | `/api/ai/chat/stream` | SSE 流式返回，需登录（Cookie JWT）；请求体同样支持 `model` |
