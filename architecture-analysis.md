# suanfa_vue 前后端架构分析报告

> 日期：2026-09-01
> 范围：`suanfa_vue/`（Vue 3 算法学习可视化网站）
> 性质：现状分析 + 后端化架构规划（不含功能代码实现）

---

## 0. TL;DR

**现状**：一个纯前端 Vue 3 SPA，27 个算法可视化详情组件 + 3 个分类页 + 28 条懒加载路由。无任何后端、无 API 调用、无集中式状态管理。最大架构问题是**算法元数据三重硬编码**（改一条复杂度信息要动 28+ 个文件）和**可视化脚手架大范围重复**（跨 27 个组件逐字相同的函数/CSS 有上千行）。

**结论**：当前项目**不需要立即引入后端**——它的数据是静态的、计算在浏览器本地即可完成。后端化的价值不在"必须有服务器"，而在**数据单一化**。建议顺序：先做前端数据层重构（单一数据源 + 抽取共享 composables），把"分析能力"沉淀为可复用模块；阶段三（用户登录 + 学习内容 + 多端内容）已确认进入路线图，待阶段一/二完成后再实施。报告给出了三阶段演进路线。

**已完成（2026-09-01）**：① 删除 TaskExportComponent + xlsx + `/task-export` 路由（产物 -287KB）；② `index.html` 修正为 `zh-CN` + 中文标题 + SEO meta；③ **阶段一（前端数据层重构）已完成**：`src/data/algorithms.js` 单一数据源（27 条）、`AlgorithmComplexity.vue` 共享复杂度组件、3 个分类页改用语义 id（消除魔法数字）、GraphPage 13→11 条对齐路由、Home 对比表数据驱动；④ **阶段二（组件与样式收敛）已完成**：3 个可视化 composables 抽取并迁移 19/27 个 Detail 组件、CSS 3328→2636 行、重复 @import 与 button-styles 全局化清理完毕（详见 §4.2）；⑤ **阶段二技术债清理（2026-09-01）**：Interpolation/Jump 搜索迁移完成、HeapSort Composition API 化完成（保持独立脚手架）、后端运行时已拍板 **Java + Spring Boot**、F2 图组件经实证评估后**保持独立**（图模型与布局双重不兼容，详见 §4.2 技术债表）；⑥ **阶段三后端化 MVP（2026-09-01）**：Spring Boot 3.2 + SQLite 后端落地 `backend/`，算法元数据服务化（种子源自前端单一数据源）、JWT + httpOnly cookie 认证、学习进度 API、前端 `api/client.js` + Pinia 登录/进度/路由守卫，端到端验证通过（详见 §4.3 执行结果）。

---

## 1. 项目现状总览

### 1.1 技术栈与工程配置

| 项 | 值 | 备注 |
|---|---|---|
| 框架 | Vue 3.5.18 | 主流使用 `<script setup>` + Composition API |
| 构建 | Vite 7.1.2 | `vite.config.js` 极简，仅注册 vue 插件 |
| 路由 | Vue Router 4.5.1 | `createWebHistory`，29 条路由全懒加载 |
| 导出 | xlsx 0.18.5 | 仅被 TaskExportComponent 一个组件使用 |
| 测试 | 无 | 无单测、无 E2E、无 lint 配置 |
| 状态管理 | 无 | 无 Pinia/Vuex，全部组件内 `ref()`/`reactive()` |
| 网络层 | 无 | 全项目 0 处 `fetch/axios/XMLHttpRequest/WebSocket` |

构建健康度：`npm run build` 正常（约 3.7s），但存在下列工程卫生问题：

- `index.html` 标题仍是 Vite 默认的 `Vite + Vue`，`lang="en"`，无 meta description / SEO 配置；
- 根目录 `archive/` 残留 10 个死文件（`verify-fix.js`、`test-*.html` 等调试产物）；
- 混合语言提交信息（git log 中既有中文 commit 也有英文 commit），无 commit 规范。

### 1.2 目录结构

```
suanfa_vue/src/
├── main.js                  # 入口：createApp + router
├── App.vue                  # 根壳：header 导航 + router-view + footer
├── style.css                # 全局样式（CSS 变量、重置、复杂度块）
├── router/index.js          # 29 条路由
└── components/
    ├── common/              # Home / About / TaskExportComponent + button-styles.css
    └── algorithms/
        ├── sorting_algorithms/    # SortingPage + 10 个 Detail + 6 个 CSS
        ├── searching_algorithms/  # SearchingPage + 6 个 Detail + 5 个 CSS
        └── graph_algorithms/      # GraphPage + 11 个 Detail + 2 个 CSS
```

### 1.3 路由架构

29 条路由全部采用 `() => import(...)` 懒加载，分包粒度 = 组件粒度（`/task-export` 路由已于 2026-09-01 随 TaskExportComponent 一并删除，现为 28 条）：

| 分组 | 数量 | 说明 |
|---|---|---|
| 根/静态 | 2 | `/`、`/about` |
| 排序 | 11 | `/algorithms/sorting/*`（1 分类页 + 10 详情） |
| 搜索 | 7 | `/algorithms/searching/*`（1 分类页 + 6 详情） |
| 图 | 12 | `/algorithms/graph/*`（1 分类页 + 11 详情） |

无路由守卫、无命名视图、无全局 afterEach/beforeEach 逻辑。`/task-export` 路由与算法核心业务无关（见 2.5）。

---

## 2. 前端现状深度分析

### 2.1 组件架构：统一 4-Tab 详情模式 ⭐

27 个 `*Detail.vue` 组件共享同一套结构模式：

```
Detail 组件（零 props，唯一事件 emit('close')）
└── modal-header（标题 + 4 个 Tab）
    ├── basic     基础：算法描述 + 复杂度表格 + 伪代码 + Python/JS 实现
    ├── sort/search/graph   可视化：stats 面板 + 可视化容器 + 控件 + 步骤历史
    ├── advanced  进阶：优化策略 + 适用场景
    └── notes     笔记/学习
```

**Props/Emits 契约**：分类页（SortingPage/SearchingPage/GraphPage）各自维护 `selectedAlgorithm: ref<number|null>`，用 `v-if="selectedAlgorithm === N"` 条件挂载对应 Detail，只传一个 `@close` 事件。**Detail 组件零 props、完全自包含**——自己管理 listSize、speed、数据数组等全部状态。

**架构评价**：这种"每个算法一个自包含大组件"的模式在 27 个组件规模下已经产生严重重复。重复证据（详见 2.3）：

- 分类页 → 详情页的挂载方式依赖**魔法数字 id**（`selectedAlgorithm === 1` 即冒泡排序），易错且不可维护；
- 详情页自包含导致公共能力无法复用。

### 2.2 状态管理与数据流

**结论：零集中式状态，纯组件内局部状态。**

```
数据流向：
  SortingPage ── sortingAlgorithms[]（硬编码数组）──► 模板渲染卡片
       │
       └─ selectedAlgorithm ──► v-if 挂载 BubbleSortDetail（零 props）
                                      └─ emit('close') ──► 关闭
```

- 无 Pinia/Vuex/createStore，全项目搜索 0 命中；
- 唯一的"共享状态"是各分类页的 `selectedAlgorithm`，也仅存在于单个分类页组件内；
- 用户可编辑状态（动画步骤、用户输入）全部是组件内瞬时状态，刷新即失。

### 2.3 严重代码重复：可视化脚手架 ⭐⭐

这是全项目**最值得重构**的部分。重复不是"风格近似"，而是**逐字相同**：

| 重复单元 | 重复范围 | 体量 |
|---|---|---|
| `generateNewList`（含 clampedSize 校验、`resetSort` 调用） | 排序 4+ 个组件（BubbleSort/QuickSort/SelectionSort/MergeSort） | ~60 行 × 4 |
| `resetSort`（Fisher-Yates 洗牌 + 统计清零） | 排序全部 10 个组件 | ~40 行 × 10 |
| `generateNewGraph` | BFS/DFS/Dijkstra/A* 图组件 | ~65 行 × 4 |
| `generateNodesPositions` + `getEdgePath` | **所有**图算法组件 | 逐字相同 |
| stats-container / controls / steps-history 模板 + 样式 | 排序类、搜索类、图类各自内部 | 逐字相同 |
| `common-algorithm-page.css` vs `common-searching-page.css` | 分类页壳样式 | ~15 个类逐字重复 |
| `linear-search-detail.css` (564行) vs `binary-search-detail.css` (534行) | 搜索详情样式 | ~70% 相同 |
| `dfs-styles.css` (327行) vs `bfs-styles.css` (436行) | 图详情样式 | ~60% 相同 |

其他重复证据：

- `merge-sort-detail.css` 与 `heap-sort-detail.css` 各自**文件内部**把 `.step-item.heapify/.extract` 规则定义了两次；
- `SelectionSortDetail.vue`、`InsertionSortDetail.vue`、`QuickSortDetail.vue` 各自有**两处重复的 `@import` 块**（同一 CSS 导入两次）；
- `HashingSearchDetail.vue` 跨类别引用了 `binary-search-detail.css`（命名与归属混乱）；
- `DijkstraDetail.vue` 用 `dfs-styles.css`、`AStarDetail.vue` 用 `bfs-styles.css`——图算法共用样式靠"借用邻居文件"实现，命名与内容不对齐。

### 2.4 样式体系：15 个 CSS 文件 / 3328 行 / 零预处理器

- 纯 CSS，无 SCSS/Sass，`@extend` 0 处（上一轮已把 @extend 反模式清掉）；
- 全部 35 个 `.vue` 文件都有 `<style>` 块，且大量组件同时 `@import` 公共 CSS + 自带大段内联样式，职责边界模糊；
- 公共样式不是"单一来源"：`.detail-container` 在 `common-algorithm-page.css`、`common-searching-page.css`、`bfs-styles.css` 三处重复定义；`.algorithm-card`、`.category-tabs`、`.complexity-analysis` 等在两个公共壳文件里逐字重复；
- `button-styles.css`（139 行按钮体系）**只被 CountingSortDetail 一个组件引用**，其余组件各自内联按钮样式。

### 2.5 数据架构：算法元数据三重硬编码 ⭐⭐

**算法元数据（名称/难度/复杂度/稳定性/描述）没有单一数据源，在三个位置重复：**

```
位置 A：分类页硬编码数组
  SortingPage.vue   sortingAlgorithms[]     10 条（52-143 行）
  SearchingPage.vue searchingAlgorithms[]    6 条（39-88 行）
  GraphPage.vue     graphAlgorithms[]       13 条（97-202 行，仅 11 条有路由）

位置 B：每个 Detail 组件模板内联复杂度块
  BubbleSortDetail.vue  O(n²)/O(n)/O(1)/稳定/简单 …（347-368 行）
  … 27 个 Detail 各一份

位置 C：Home.vue 首页静态复杂度对比表（硬编码 HTML）
```

**影响**：修改任意一条算法元数据（如修正复杂度）需同时改 分类页数组 + 详情页模板 + 可能首页表格，28+ 个文件。GraphPage 的 13 条数据与 11 条路由存在**数据-路由漂移**（2 条无路由的幽灵数据）。

### 2.6 构建与性能

| 指标 | 值 | 解读 |
|---|---|---|
| 产物总 JS | 645 KB（TaskExport 删除前 932 KB） | 中等 |
| 产物总 CSS | 380 KB | 偏大（详见下方） |
| JS chunk 数 | 34 | 每组件一个 chunk，懒加载粒度合理 |
| CSS chunk 数 | 34 | 与 JS 同步拆分，但公共样式被打散进各 chunk |
| 最大 chunk | DijkstraDetail 类详情组件 ~24 KB | 无重依赖，健康 |
| 入口 chunk | index 100 KB（gzip 38.9 KB） | 合理 |

**关键观察（已解决）**：`xlsx`（0.18.5）曾为 `TaskExportComponent` 贡献约 287KB 产物（近 1/4 总 JS）。2026-09-01 已删除该组件及其路由，总 JS 从 932KB 降至约 645KB。

### 2.7 遗留异常组件

- **HeapSortDetail.vue**：27 个 Detail 中**唯一**使用 Options API 的组件（其余均为 `<script setup>`），需迁移以统一；
- **SimpleBubbleSort.vue**（91 行）：独立简化版冒泡排序，无步骤记录/动画/统计，与 BubbleSortDetail 是两套独立实现，保留或废弃需决策；
- ~~**TaskExportComponent.vue**~~：DOM 爬取外部页面（`teamix-layout-content`）生成假数据并导出 Excel，与算法可视化完全无关。**已删除（2026-09-01）**。

---

## 3. 后端化必要性判断

### 3.1 现状评估：哪些"后端能力"其实不需要

| 候选后端能力 | 现状 | 是否值得后端化 |
|---|---|---|
| 算法执行/步骤计算 | 全在前端本地 JS 执行 | **不需要**——27 个算法都是教科书级实现，前端执行即合理 |
| 复杂度分析 | 硬编码字符串 | **不需要后端**——这是静态知识，应做前端数据单一化而非 API |
| 算法基准测试（真实耗时/对比） | 无此功能 | **可选**——需要时才值得，且仍可纯前端做 |
| 用户数据（收藏/学习记录/进度） | 无 | **值得后端化**——已确认进入阶段三路线图（用户登录 + 学习内容） |
| 多端共享内容 | 无 | **值得后端化**——已确认进入阶段三路线图（多端内容同一 API 出口） |

### 3.2 核心结论

> **当前项目引入后端属于"为架构而架构"。真正的病灶是数据重复与代码重复，两者都在前端内可解。** 后端化的时机取决于"是否有跨端共享数据 / 用户数据持久化"的产品诉求。

> 决策（2026-09-01）：阶段三**已确认进入路线图**（用户登录 + 学习内容 + 多端内容），但执行顺序不变——先完成阶段一/二的纯前端重构，再引入后端，避免把前端的三重硬编码原样搬进数据库。

据此，本报告的"前后端架构规划"按 **三阶段演进** 给出，阶段一、二为纯前端重构（立刻可做、收益最大），阶段三为已定型的后端化路线。

---

## 4. 目标架构规划

### 4.1 阶段一：前端数据层重构（最高优先，1-2 天）✅ 已完成（2026-09-01）

**目标：消灭三重硬编码，建立单一数据源。**

1. 新建 `src/data/algorithms.js`（或 `algorithms.json`），集中定义 27 个算法元数据：

   ```js
   export const algorithms = [
     {
       id: 'bubble-sort',
       name: '冒泡排序',
       category: 'sorting',
       difficulty: '简单',
       stability: '稳定',
       complexity: { best: 'O(n)', worst: 'O(n²)', avg: 'O(n²)', space: 'O(1)' },
       description: '...',
       route: '/algorithms/sorting/bubble-sort',
     },
     // ... 27 条
   ]
   ```

2. 三个分类页从数组派生展示数据（替代各自硬编码数组）；**以 `id` 取代魔法数字**挂载详情（`selectedAlgorithm === 'bubble-sort'`）；
3. 详情页复杂度块改为从元数据渲染（用 `defineProps` 接收或从共享数据取），删除模板内联硬编码；
4. Home.vue 静态对比表改为数据驱动；
5. 同步清理：GraphPage 13 条 → 11 条（对齐路由）、删除 `/task-export` 相关判断、`index.html` 标题/SEO、archive 死文件。

**验收**：`grep -c "O(n²)" src/components` 命中数大幅下降；修改一条算法元数据只需改 1 个文件。

### 4.2 阶段二：组件与样式收敛（高优先，2-3 天）✅ 已完成（2026-09-01）

**目标：消除逐字重复的脚手架与样式。**

1. **抽取 composables**：
   - `useSortingVisualization`（generateRandomData / generateNewList / resetSort / 步骤记录）；
   - `useSearchingVisualization`、`useGraphVisualization`（generateNewGraph / generateNodesPositions / getEdgePath / resetSearch）；
   - 各 Detail 只保留**算法专属逻辑**（sortFn/searchFn/graphFn + 步骤生成器），可视化调度交给 composable。
2. **抽取公共布局**：`DetailLayout.vue`（4-Tab 壳 + 复杂度表格 + 代码块展示），Detail 组件变薄为"算法逻辑 + 可视化配置"。
3. **样式合并**：
   - 合并 `common-algorithm-page.css` + `common-searching-page.css` → `common-category-page.css`；
   - 抽取 `linear/binary-search-detail.css` 共享部分 → `common-search-detail.css`（两文件 ~70% 相同）；
   - 抽取 `dfs/bfs-styles.css` 共享部分 → `common-graph-styles.css`；
   - `button-styles.css` 提升到全局 `style.css` 统一引入；
   - 修复重复 `@import`（SelectionSort/InsertionSort/QuickSort）与跨类别错误引用（HashingSearch 引 binary-search-detail.css；Dijkstra/A* 样式归属）。
4. HeapSortDetail 迁移 Composition API。

**验收**：CSS 总量从 3328 行显著下降；`grep generateNewList` 从 4+ 处降到 1 处；构建产物 CSS chunk 减少。

**执行结果（2026-09-01）**：

- 3 个 composables 落地（`src/composables/`），19/27 个 Detail 组件完成迁移并接入；`const generateNewList` 组件内定义从 4+ → **1**（仅 HashingSearch 的哈希表重建 wrapper）；`const resetSearch/resetSort` → **2**（仅未迁移的 Interpolation/Jump 残留）。
- CSS 总量 **3328 → 2636 行（-21%）**；新增 `common-search-detail.css`（369 行）、`common-graph-styles.css`（237 行）；`linear-search-detail.css` 563→172、`binary-search-detail.css` 533→146、`dfs-styles.css` 435→159、`bfs-styles.css` 326→71；SearchingPage 内联绿系覆盖已折回 `common-searching-page.css` 并恢复 `.complexity-display`（#999/14px，基线一致）；`button-styles.css` 已删除、内容并入全局 `style.css`（289 行）；Selection/Insertion/QuickSort 重复 `@import` 已清理。
- 验证：`npm run build` 通过（仅 TopologicalSort 既有 sourcemap 警告，构建 exit 0）；Playwright 冒烟覆盖 3 分类页 + Bubble/Counting/Linear/BFS/Binary/Exponential/Hashing 全通过，页面 JS 错误 0。

**技术债（2026-09-01 清理进展）**：

| 项 | 状态 |
|---|---|
| InterpolationSearchDetail / JumpSearchDetail 迁移 | ✅ **已清理**：两组件已接入 `useSearchingVisualization`（保留各自算法与动画逻辑；命名差异通过映射处理），冒烟通过 |
| HeapSortDetail 迁移 Composition API | ✅ **已清理（部分）**：已从 Options API 迁移为 `<script setup>`；其可视化模型（originalList + stepsHistory 字符串 + sortingStatus 枚举 + heapifyCount）与 composable 不兼容，**有意保持独立脚手架**（强行接入需给 composable 加 3+ 选项，为单一组件膨胀公共层不划算） |
| 图算法 F2 族（Prim/Kruskal/TopologicalSort/FordFulkerson/EdmondsKarp）布局抽取 | ❌ **保持独立（2026-09-01 实证结论）**：手写比对确认 F2 与 composable 存在**双重不兼容**——① 布局函数根本性分歧（Prim=字母环形；Kruskal/Topo=环形；FordFulkerson=水平线性；EdmondsKarp=源左/汇右），归一化会摧毁最大流算法流向语义；② 图数据模型分歧（Kruskal 的 `graphData` 为 `{graph, edges}` 复合对象、FordFulkerson/EdmondsKarp 含源汇结构，而 composable 的 `graph` 假定纯邻接表）。强行接入会产生「一半脚手架来自 composable、一半图模型留本地」的混合体，比自包含版本更难维护。仅 `getEdgePath`（3-4 组件逐字一致）不足以抵消混合复杂度。曾尝试 `generateNodesPositions` 选项扩展后回滚（避免死 API）。**保留为长期技术债，附证据** |
| Dijkstra 的 `getEdgePath` 本地保留 | 模板依赖 `.weightPosition`，抽取会破坏权重标注渲染 |
| DetailLayout.vue 抽取 | 27 个组件模板结构高度相似但标签/内容各异，单独抽取需逐一核对 props，留作后续独立任务 |

### 4.3 阶段三：后端化（已入路线图，预估 4-6 天）

> 决策（2026-09-01）：本阶段**进入正式路线图**，范围 = 用户登录 + 学习内容管理 + 多端内容。前置依赖为阶段一、二完成（数据单一化 + 组件收敛），否则后端会把前端的三重硬编码原样搬进数据库。

**范围拆解**：

| 能力 | 说明 | 后端依赖 |
|---|---|---|
| 用户登录 | 账号注册/登录（起步可免密或 JWT），用户身份隔离 | ✅ 必须 |
| 学习内容 | 算法元数据、复杂度、代码示例从数据库下发；学习进度/收藏/练习记录持久化 | ✅ 必须 |
| 多端内容 | 算法内容可供 Web / 移动端 / 学习工具等共享消费，同一 API 出口 | ✅ 必须 |

**目标架构**：

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  前端（Vue 3 SPA）        │  HTTP  │  后端                     │
│                         │  JSON  │                          │
│  components/            │◄──────►│  API 层（REST）            │
│  composables/（算法引擎）  │        │  /api/algorithms          │
│  data/（本地元数据兜底）    │        │  /api/users/:id/progress  │
│  api/client.js（fetch）   │        │  /api/benchmarks         │
└─────────────────────────┘        └──────────────────────────┘
```

**技术栈建议**：

| 层 | 选项 | 理由 |
|---|---|---|
| 后端运行时 | **Java + Spring Boot（2026-09-01 已拍板）** | 团队已有 Java 技术栈积累；Spring Boot 生态成熟（Spring Security JWT、Spring Data JPA） |
| 数据层 | SQLite（起步）→ PostgreSQL（若多人/云端） | 学习进度类数据量极小，SQLite 足够 |
| 认证 | JWT + httpOnly cookie（登录/学习内容为多端共享前提） | 多端内容必须识别用户身份 |
| 部署 | Vite build 静态产物 + 单进程 API 服务同机 | 保持简单 |

**API 设计草案**：

```
POST /api/auth/register                     → 注册（用户名+密码 → JWT）
POST /api/auth/login                        → 登录（→ JWT，httpOnly cookie）
GET  /api/algorithms                        → 算法元数据列表（阶段一数据源的服务器版）
GET  /api/algorithms/:id                    → 单算法元数据 + 复杂度 + 代码示例
GET  /api/users/:id/progress                → 拉取学习进度（已学/收藏/练习记录）
PUT  /api/users/:id/progress/:algorithmId   → 更新单算法学习状态
GET  /api/benchmarks                        → 触发并返回算法基准测试结果（实测耗时/步数）
```

**前端改造点**：
- 新增 `src/api/client.js`（轻量 fetch 封装，统一携带认证 cookie），算法元数据优先请求 API、失败回退本地 `data/algorithms.js`（静态兜底，保证纯静态部署仍可用）；
- 数据获取用 `useFetch`-style composable 或直接组合式函数；
- 登录/学习进度功能引入 Pinia 管理跨页面用户状态（`useUserStore`），**在阶段三之前不要引入**；
- 路由守卫：`/login` 开放，学习记录页需认证。

**执行结果（2026-09-01，MVP 完成）**：

| 项 | 结果 |
|---|---|
| 后端运行时 | ✅ **Java 17 + Spring Boot 3.2 + Maven**，落地于 `backend/`（`mvn spring-boot:run` 启动，端口 8080） |
| 数据层 | ✅ SQLite（`data/suanfa.db`）+ Spring JDBC（JdbcTemplate，三表：algorithms/users/progress），**刻意不用 Hibernate**（避免 SQLite 方言兼容问题，三张表用 JDBC 足够） |
| 算法元数据服务化 | ✅ `GET /api/algorithms`（支持 `?category=` 过滤）、`GET /api/algorithms/:id`；种子数据由 Node 脚本从**前端单一数据源 `src/data/algorithms.js` 导出**（27 条，保证前后端元数据永远一致），启动时幂等导入 |
| 认证 | ✅ `POST /api/auth/register|login|logout`、`GET /api/auth/me`；JWT（HS256，jjwt 0.11.5）+ **httpOnly cookie**（SameSite=Lax）+ BCrypt 密码哈希 |
| 学习进度 | ✅ `GET/PUT /api/users/:id/progress`（需认证，仅本人可读写；`ON CONFLICT` upsert；status ∈ learning/learned/favorited） |
| 前端 API 层 | ✅ `src/api/client.js`（`credentials: include` + 后端可用性懒探测 + **本地元数据兜底回退**）；`vite.config.js` 增加 `/api` dev 代理 |
| 前端登录/进度 | ✅ Pinia `useUserStore` + `Login.vue` + `ProgressPage.vue` + 路由守卫（`/progress` 未登录重定向 `/login?redirect=...`，登录后回跳）；三个分类页卡片接入 `ProgressMark.vue`（已掌握/收藏标记） |
| 多端共享 | 算法元数据走同一 REST 出口，为多端消费预留（Web 已接入，移动端/工具可复用同一 API） |

**验证**：后端 API 冒烟 11 项全绿（列表/详情/404/注册/登录/错误密码 401/me/cookie 未登录 401/进度读写/越权 401/无效 status 400/upsert）；Playwright 端到端 8 步全绿（守卫重定向→注册→标记已掌握→收藏→进度页分组展示→刷新持久化→退出被拦→重新登录进度仍在），全程 0 JS 错误；前端全量回归冒烟通过。`npm run build` exit 0。

**遗留（后续迭代）**：算法元数据回退路径仍读本地 `data/algorithms.js`（未做「API 成功时写缓存」）；详情页未内置进度标记（标记在分类页卡片上）；`/api/benchmarks` 未实现；JWT secret 需生产环境变量覆盖。

---

## 5. 优先级矩阵

| # | 事项 | 影响 | 成本 | 优先级 |
|---|---|---|---|---|
| 1 | 算法元数据单一化（阶段一） | 消除 28+ 文件重复维护 | ✅ 已执行 | 🟢 完成 |
| 2 | 魔法数字 id → 语义 id | 消除易错挂载 | ✅ 已执行 | 🟢 完成 |
| 3 | 抽取可视化 composables（阶段二） | 消除上千行重复 | ✅ 已执行 | 🟢 完成 |
| 4 | CSS 收敛合并（阶段二） | CSS 3328 行 → 减半 | ✅ 已执行 | 🟢 完成 |
| 5 | 删除 TaskExportComponent + xlsx | 产物 -287KB + 移除 /task-export 路由 | ✅ 已执行 | 🟢 完成 |
| 6 | 后端引入（阶段三：用户登录/学习内容/多端内容） | 用户体系 + 内容服务化 | 4-6 天（阶段一二完成后） | 🟢 完成（MVP 2026-09-01，详见 4.3） |
| 7 | HeapSort Options→Composition | 一致性 | ✅ 已执行（保持独立脚手架，模型与 composable 不兼容） | 🟢 完成 |
| 8 | index.html zh-CN + SEO（meta description/keywords） | 中文 SEO 就绪 | ✅ 已执行 | 🟢 完成 |

---

## 6. 决策点（已于 2026-09-01 拍板）

| # | 决策点 | 结论 | 状态 |
|---|---|---|---|
| 1 | TaskExportComponent 与 xlsx | **删除**（遗留工具，与算法业务无关，产物体积 -287KB） | ✅ 已执行 |
| 2 | SimpleBubbleSort 去留 | **保留**（作为独立简化演示，待定） | ⏳ 待定 |
| 3 | 阶段三是否进入路线图 | **进入**，范围明确为：用户登录 + 学习内容管理 + 多端内容 | ✅ 已纳入 4.3 |
| 4 | 内容语言 | **修正为 zh-CN**，元数据结构预留 i18n 扩展字段 | ✅ 已执行（index.html） |
| 5 | 阶段三后端运行时 | **Java + Spring Boot**（2026-09-01 拍板） | ✅ 已执行 4.3 |
| 6 | 阶段三 MVP 范围 | **用户登录 + 学习内容服务化 + 进度持久化**（多端共享预留 API） | ✅ 已完成（2026-09-01，4.3） |

---

## 附录 A：证据索引

- 路由：`src/router/index.js`（28 条懒加载路由，Edmonds-Karp/Ford-Fulkerson 为内联动态导入；`/task-export` 已删除）
- 元数据硬编码：`SortingPage.vue:52-143`、`SearchingPage.vue:39-88`、`GraphPage.vue:97-202`、`BubbleSortDetail.vue:347-368`（每 Detail 各有内联复杂度块）
- 脚手架重复：`BubbleSortDetail.vue:59-116/261-316`、`QuickSortDetail.vue:64-122/307-365`、`SelectionSortDetail.vue:58-116/313-370`、`MergeSortDetail.vue:58-116/254-310`（generateNewList/resetSort）；`BFSDetail.vue:111-133/136-197/200-236` 等图组件（generateNodesPositions/generateNewGraph/getEdgePath）
- CSS 重复：`common-algorithm-page.css`(164 行) vs `common-searching-page.css`(269 行) 共享 ~15 个类；`linear-search-detail.css`(564) vs `binary-search-detail.css`(534) ~70% 相同；`dfs-styles.css`(327) vs `bfs-styles.css`(436) ~60% 相同；`.detail-container` 三处定义
- 异常引用：`HashingSearchDetail.vue → binary-search-detail.css`；`DijkstraDetail.vue → dfs-styles.css`；`AStarDetail.vue → bfs-styles.css`；`SelectionSort/InsertionSort/QuickSortDetail.vue` 重复 @import
- 产物：总 JS ~645KB（TaskExport 删除前 932KB，含 xlsx 287KB）；总 CSS 380KB；34 JS + 34 CSS chunks
- 唯一 Options API：`HeapSortDetail.vue:311-545`（`export default { data(), methods() }`）
- 无网络层证据：src/ 下 `fetch|axios|XMLHttpRequest|WebSocket` 全 0 命中