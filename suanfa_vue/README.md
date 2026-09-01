# suanfa_vue 算法学习可视化网站

一个基于 Vue 3 的算法学习可视化网站，用交互式动画演示算法的执行过程。网站覆盖排序、搜索、图论三大类共 27 个算法，每个算法都有独立的可视化详情页，可以逐步观察元素比较、交换以及图遍历的完整过程，帮助直观理解算法原理。

## 技术栈

- Vue 3（Composition API，`<script setup>` 语法）
- Vite 7（开发服务器与构建工具）
- Vue Router 4（前端路由）

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

共 27 个算法可视化详情，分为三大类。

### 排序算法（10 个）

冒泡排序、选择排序、插入排序、希尔排序、归并排序、快速排序、堆排序、计数排序、桶排序、基数排序。

### 搜索算法（6 个）

线性搜索、二分搜索、插值搜索、跳跃搜索、指数搜索、哈希搜索。

### 图算法（11 个）

广度优先搜索（BFS）、深度优先搜索（DFS）、Dijkstra 最短路径、Bellman-Ford 最短路径、Floyd-Warshall 多源最短路径、A* 寻路、Prim 最小生成树、Kruskal 最小生成树、拓扑排序、Ford-Fulkerson 最大流、Edmonds-Karp 最大流。

## 目录结构

```
suanfa_vue/
├── index.html                    # 入口 HTML
├── package.json                  # 依赖与脚本配置
├── vite.config.js                # Vite 配置
└── src/
    ├── main.js                   # 应用入口
    ├── App.vue                   # 根组件
    ├── style.css                 # 全局样式
    ├── assets/                   # 静态资源
    ├── router/
    │   └── index.js              # 路由配置
    └── components/
        ├── common/               # 首页、关于页等通用组件
        └── algorithms/
            ├── sorting_algorithms/     # 排序：SortingPage 分类页 + 10 个 *Detail.vue 详情组件
            ├── searching_algorithms/   # 搜索：SearchingPage 分类页 + 6 个 *Detail.vue 详情组件
            └── graph_algorithms/       # 图：GraphPage 分类页 + 11 个 *Detail.vue 详情组件
```

每个分类目录下都有一个分类页组件（SortingPage、SearchingPage、GraphPage），负责展示算法列表。分类页内部通过 `selectedAlgorithm` 状态条件挂载当前选中的算法详情组件，各详情路径在路由表中平铺注册，可直接访问。
