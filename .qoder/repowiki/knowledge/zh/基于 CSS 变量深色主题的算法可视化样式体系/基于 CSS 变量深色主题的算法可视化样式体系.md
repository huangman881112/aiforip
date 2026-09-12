---
kind: frontend_style
name: 基于 CSS 变量深色主题的算法可视化样式体系
category: frontend_style
scope:
    - '**'
source_files:
    - suanfa_vue/src/styles/theme.css
    - suanfa_vue/src/style.css
    - suanfa_vue/src/components/algorithms/sorting_algorithms/common-algorithm-page.css
    - suanfa_vue/src/components/algorithms/sorting_algorithms/common-sort-styles.css
    - suanfa_vue/src/components/algorithms/searching_algorithms/common-search-detail.css
    - suanfa_vue/src/components/algorithms/graph_algorithms/common-graph-styles.css
    - suanfa_vue/src/components/algorithms/algo-viz-common.css
    - suanfa_vue/package.json
---

## 1. 整体方案

前端采用 **纯 CSS + CSS 自定义属性（CSS Variables）** 的样式体系，没有引入任何 UI 组件库（如 Element Plus、Ant Design Vue）或 CSS-in-JS 框架。样式以 Vite 单页应用方式组织，入口 `src/style.css` 负责全局字体、滚动条、基础按钮与卡片，主题色集中定义在 `src/styles/theme.css`，各算法分类下再按「通用层 + 分类层 + 具体算法层」三级拆分。

项目依赖中仅声明了 `vue`、`vue-router`、`pinia`、`marked`、`dompurify`，没有任何 Tailwind、PostCSS 插件或 Sass/Less 预处理器——所有样式都是原生 CSS。

## 2. 设计令牌（Design Tokens）

核心令牌文件：`suanfa_vue/src/styles/theme.css`

- 通过 `:root` 下的 CSS 变量集中管理全站颜色，包括品牌色（`--brand-400/500/600/700`）、页面画布（`--app-bg / --surface / --surface-muted / --surface-2 / --surface-3`）、文字层级（`--text-1/2/3`）、语义强调色（`--c-blue/green/red/orange/amber/purple/cyan/pink`）、半透明色块（`--tint-*` 及 `--tint-*-border`）、导航栏专用变量（`--nav-*`）和页脚变量（`--footer-*`）。
- 文件顶部注释明确约定：**深色主题只在 `:root` 维护，组件样式一律引用变量，禁止写死 `#fff` / `#f8fafc` 等硬编码底色**；换肤只需覆盖 `html[data-theme='light']` 下的同名变量。
- 为兼容旧组件提供别名映射：`--primary-color` → `--brand-500`、`--secondary-color` → `--c-blue`、`--accent-color` → `--c-amber` 等。

全局基础样式 `suanfa_vue/src/style.css` 将 `color-scheme: dark` 应用到根节点，并通过 `body` 上的径向渐变背景营造深空氛围，同时统一滚动条、选中文本、`a`、`button`、`.card`、`.btn-*`、`.tab-btn` 等基础元素外观。

## 3. 目录结构与分层约定

```suanfa_vue/src/components/algorithms/
├── algo-viz-common.css          # DP/贪心详情页「可视化区」公共壳（.viz-shell/.viz-section/.viz-controls...）
├── vizRegistry.js               # 可视化组件注册表
├── sorting_algorithms/
│   ├── common-algorithm-page.css  # 分类页容器（.algorithm-page-container / .algorithms-grid / .algorithm-card）
│   ├── common-sort-styles.css     # 排序类通用：模态框、统计条、柱状图、步骤历史
│   ├── <Algorithm>Detail.vue
│   └── <algorithm>-detail.css     # 单个排序算法专属样式
├── searching_algorithms/
│   ├── common-search-detail.css   # 搜索类通用：数组可视化、滑块、步骤列表
│   ├── <Search>Detail.vue
│   └── <search>-detail.css
├── graph_algorithms/
│   ├── common-graph-styles.css    # 图类通用：节点、SVG、路径高亮
│   ├── bfs-styles.css / dfs-styles.css  # 各自 @import common-graph-styles.css
│   └── <Graph>Detail.vue
├── dp_algorithms/
└── greedy_algorithms/
```

**分层导入链**：每个分类的 `common-*-styles.css` 通过 `@import` 复用上一级的通用样式，形成继承式样式树：
- `graph_algorithms/common-graph-styles.css` → `sorting_algorithms/common-sort-styles.css` → `sorting_algorithms/common-algorithm-page.css`
- `searching_algorithms/common-search-detail.css` → `sorting_algorithms/common-sort-styles.css`
- 各具体算法 `.css` 再 `@import` 对应分类的 `common-*-styles.css`

这种结构让新增一个算法只需编写极少的专属 CSS，其余布局、配色、交互状态全部由共享层提供。

## 4. 视觉与交互约定

- **默认深色主题**：`color-scheme: dark` 配合 `--app-bg:#0b111d` 等变量，整个站点以深蓝黑为主色调。
- **卡片与面板**：统一使用 `background-color: var(--surface)` + `border-radius: 8px` + `box-shadow: 0 2px 12px rgba(0,0,0,0.5)` 的浮层风格。
- **标签与状态**：难度/类别/稳定性等标签通过 `.difficulty-tag`、`.category-tag`、`.stable-tag`、`.unstable-tag` 等 class 复用同一套圆角胶囊样式，颜色来自 `--tint-*` + `--c-*`。
- **可视化步骤日志**：排序、搜索、图、DP、贪心共用 `.step-item.info/compare/swap/finish` 等语义化 class，背景取自 `--tint-*`，前景取自 `--c-*`，保证跨算法一致的反馈色彩。
- **响应式**：在 `common-search-detail.css` 中通过 `@media (max-width: 768px)` 和 `480px` 调整标签页换行、数组元素尺寸、控制栏方向。
- **按钮系统**：`style.css` 定义了 `.btn-primary/success/warning/danger/secondary` 以及 `.btn-sm/.btn-lg` 尺寸变体，但部分分类仍直接写死 `#3b82f6` / `#42b983` 等色值，尚未完全迁移到变量。

## 5. 约束与规范

| 规则 | 来源 | 说明 |
|---|---|---|
| 颜色必须走 CSS 变量 | `theme.css` 顶部注释 | 组件样式禁止出现 `#fff` / `#f8fafc` 等硬编码底色，换肤只改 `:root` |
| 新算法优先复用 `common-*-styles.css` | 现有 `@import` 链 | 新增算法应 `@import` 对应分类的 common 样式，而非从零写起 |
| 详情页统一使用 `.detail-container` | `common-algorithm-page.css` | 所有算法详情页外层容器需套用该 class |
| 可视化区统一使用 `.viz-shell` | `algo-viz-common.css` 注释 | DP/贪心的可视化区块遵循 `.viz-shell > .viz-section` 结构 |
| 深色主题默认启用 | `style.css` + `theme.css` | 两者均设置 `color-scheme: dark`，浅色模式需额外实现 |

## 6. 关键文件清单

- `suanfa_vue/src/styles/theme.css` — 全站设计令牌（颜色、导航、页脚）
- `suanfa_vue/src/style.css` — 全局基础样式（字体、滚动条、按钮、卡片）
- `suanfa_vue/src/components/algorithms/sorting_algorithms/common-algorithm-page.css` — 分类页容器与算法卡片网格
- `suanfa_vue/src/components/algorithms/sorting_algorithms/common-sort-styles.css` — 排序类通用样式（模态框、统计、柱状图、步骤历史）
- `suanfa_vue/src/components/algorithms/searching_algorithms/common-search-detail.css` — 搜索类通用样式（数组可视化、滑块、步骤列表）
- `suanfa_vue/src/components/algorithms/graph_algorithms/common-graph-styles.css` — 图类通用样式（节点、SVG、路径高亮）
- `suanfa_vue/src/components/algorithms/algo-viz-common.css` — DP/贪心可视化区公共壳
- `suanfa_vue/package.json` — 确认无 CSS 预处理/组件库依赖

## 7. 现状与改进空间

当前样式体系已具备清晰的 token 层与共享层，但仍有部分硬编码颜色（如 `#3b82f6`、`#42b983`、`#e74c3c`）散落在 `style.css` 和各 `*-detail.css` 中，尚未完全迁移到 `--brand-*` / `--c-*` 变量；此外，`style.css` 中的 `.btn-*` 与 `common-sort-styles.css` 中的 `.controls button` 存在重复定义，可进一步收敛到统一的按钮 token。