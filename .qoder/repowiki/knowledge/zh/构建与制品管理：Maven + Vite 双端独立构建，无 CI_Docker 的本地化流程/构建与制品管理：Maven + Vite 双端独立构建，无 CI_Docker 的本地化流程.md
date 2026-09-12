---
kind: build_system
name: 构建与制品管理：Maven + Vite 双端独立构建，无 CI/Docker 的本地化流程
category: build_system
scope:
    - '**'
source_files:
    - backend/pom.xml
    - backend/src/main/resources/application.yml
    - backend/src/main/resources/schema.sql
    - backend/.env.example
    - scripts/dev-backend.sh
    - suanfa_vue/package.json
    - suanfa_vue/vite.config.js
---

## 1. 使用的构建系统

本项目采用前后端分离、各自独立构建的方式：
- **后端（Spring Boot）**：基于 Maven 构建，继承 `spring-boot-starter-parent:3.2.0`，使用 `spring-boot-maven-plugin` 打包可执行 JAR；Java 版本锁定为 17。
- **前端（Vue 3）**：基于 Vite（`vite.config.js`），通过 `npm run build` 输出静态资源到 `suanfa_vue/dist/`。
- **开发期联调**：Vite dev server 通过 `proxy` 将 `/api` 请求转发到 `http://localhost:8080` 的后端服务，实现前后端热重载联调。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `backend/pom.xml` | Maven 工程定义、依赖声明、`spring-boot-maven-plugin` 配置 |
| `backend/src/main/resources/application.yml` | Spring Boot 运行时配置（端口、数据源等） |
| `backend/src/main/resources/schema.sql` | SQLite 数据库建表脚本，随应用启动初始化 |
| `backend/.env` / `backend/.env.example` | 环境变量（AI 中转站 token 等），由启动脚本加载 |
| `scripts/dev-backend.sh` | 一键启动后端：加载 `.env`、停旧进程、`mvn -o spring-boot:run` 并轮询 `/api/ai/status` 就绪 |
| `suanfa_vue/package.json` | npm scripts：`dev`、`build`、`preview` |
| `suanfa_vue/vite.config.js` | Vite 插件、路径解析、开发服务器代理（`/api` → 8080） |
| `suanfa_vue/dist/` | 构建产物目录（静态 HTML/CSS/JS） |

## 3. 架构与约定

### 后端构建
- 以 `com.suanfa.SuanfaApplication` 为入口类，通过 `spring-boot:run` 直接运行；生产部署时通过 `mvn package` 生成可执行 JAR。
- 数据库使用内嵌 SQLite，`schema.sql` 在应用启动时执行建表，种子数据位于 `resources/seed/algorithms.json` 与 `algorithms-content.json`。
- 依赖离线模式：`dev-backend.sh` 使用 `mvn -o` 参数，要求本地仓库已缓存依赖。
- 日志输出到 `/tmp/suanfa-backend-{PORT}.log`，便于多实例并行开发。

### 前端构建
- 使用 ES Module 模式（`"type": "module"`），Vite 作为开发与构建工具。
- 开发服务器监听所有网卡（`host: true`），并通过代理将 `/api` 请求转发到后端，避免跨域问题。
- 构建产物为纯静态文件，适合直接由 Nginx/Apache 或后端静态资源服务托管。

### 开发工作流
1. 先运行 `scripts/dev-backend.sh [--port 8080]` 启动后端，脚本会加载 `backend/.env` 并等待 `/api/ai/status` 返回。
2. 再进入 `suanfa_vue` 目录执行 `npm run dev`，Vite 自动代理 API 请求。
3. 生产构建：分别执行 `mvn package`（后端）和 `npm run build`（前端），将静态产物与后端 JAR 部署在同一机器。

## 4. 约定与约束

- **无 Dockerfile / docker-compose**：项目未包含容器化配置，部署方式为“单进程 API 服务 + 静态产物同机”（见 `architecture-analysis.md` 中的部署说明）。
- **无 CI/CD 流水线**：仓库中未发现 GitHub Actions、Jenkinsfile 或其他自动化构建/测试配置文件。
- **无 Makefile**：构建任务通过各语言原生工具（`mvn`、`npm`）与 shell 脚本完成。
- **环境变量隔离**：后端敏感配置（如 AI 中转站 token）通过 `backend/.env` 注入，不纳入版本控制（`.gitignore` 排除）。开发脚本通过 `set -a` 自动导出变量。
- **端口可配**：后端默认 8080，可通过 `--port` 参数切换；脚本通过 `curl` 轮询该端口上的健康检查接口判断就绪状态。
- **依赖锁定**：前端使用 `package-lock.json` 锁定 npm 依赖版本；后端通过 Maven 中央仓库拉取，依赖版本集中在 `pom.xml`。
- **构建产物位置**：前端静态资源固定输出到 `suanfa_vue/dist/`，后端打包产物为 `backend/target/*.jar`。

## 5. 缺失项说明

仓库中不存在以下构建系统常见要素：Dockerfile、docker-compose.yml、GitHub Actions 工作流、Makefile、发布脚本、多环境 profile（如 `application-dev.yml`/`application-prod.yml` 仅见单一 `application.yml`）。因此本项目的构建体系属于“轻量级本地开发 + 手动部署”模式。