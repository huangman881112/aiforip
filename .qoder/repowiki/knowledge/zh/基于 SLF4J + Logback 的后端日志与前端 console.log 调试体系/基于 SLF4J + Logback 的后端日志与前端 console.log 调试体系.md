---
kind: logging_system
name: 基于 SLF4J + Logback 的后端日志与前端 console.log 调试体系
category: logging_system
scope:
    - '**'
source_files:
    - backend/src/main/resources/application.yml
    - backend/src/main/java/com/suanfa/config/GlobalExceptionHandler.java
    - backend/src/main/java/com/suanfa/config/DataInitializer.java
    - backend/src/main/java/com/suanfa/controller/AiController.java
    - backend/src/main/java/com/suanfa/controller/AiSettingsController.java
    - backend/src/main/java/com/suanfa/service/AiChatService.java
    - archive/log-console.js
    - archive/log-viewer.html
---

## 1. 使用的系统与框架

- **后端（Spring Boot）**：使用 SLF4J 作为日志门面，配合 Spring Boot 内置的 Logback 实现。所有业务类通过 `org.slf4j.LoggerFactory` 获取 `Logger` 实例，并以静态字段持有。
- **前端（Vue3 + Vite）**：未引入任何第三方日志库，直接使用浏览器原生 `console.log / console.error / console.warn / console.debug`；开发期通过 `suanfa_vue/logs/` 目录下的日志文件（由 Vite 或构建工具输出）以及归档中的 `archive/log-console.js`、`archive/log-viewer.html` 进行本地控制台日志捕获与查看。

## 2. 关键文件与位置

- 后端日志配置：`backend/src/main/resources/application.yml`（第 98–101 行），定义根日志级别与包级别覆盖。
- 后端日志使用示例：
  - `backend/src/main/java/com/suanfa/config/DataInitializer.java` — 启动时数据初始化日志（info/warn）。
  - `backend/src/main/java/com/suanfa/config/GlobalExceptionHandler.java` — 全局异常处理日志（warn/error）。
  - `backend/src/main/java/com/suanfa/controller/AiController.java` — AI 对话/流式 SSE 调用日志（debug/error）。
  - `backend/src/main/java/com/suanfa/controller/AiSettingsController.java` — AI 设置保存与连接测试日志（error）。
  - `backend/src/main/java/com/suanfa/service/AiChatService.java` — 聊天服务日志。
- 前端调试工具（归档）：`archive/log-console.js`（重定向 console 到 localStorage）、`archive/log-viewer.html`（读取并展示 localStorage 中的日志）。
- 前端日志输出目录：`suanfa_vue/logs/`（当前为空，Vite 默认不持久化 console 输出）。

## 3. 架构与约定

### 后端（SLF4J + Logback）
- **Logger 获取方式**：每个类声明 `private static final Logger log = LoggerFactory.getLogger(ClassName.class);`，统一通过静态字段复用实例。
- **日志级别策略**：在 `application.yml` 中通过 `logging.level` 配置：
  - `root: info` — 根日志级别为 INFO。
  - `com.suanfa: debug` — 应用自身包下日志降级为 DEBUG，便于本地开发排查。
- **结构化字段**：日志消息采用 SLF4J 占位符风格（如 `log.info("算法元数据补齐 {} 条（现共 {} 条）", added, size)`），而非字符串拼接；但未见统一的 JSON 结构化日志格式（如包含 traceId、userId、requestId 等字段）。
- **错误处理集中化**：`GlobalExceptionHandler` 统一捕获异常并以 warn/error 级别记录，避免各 Controller 重复 try-catch 打点。
- **SSE 场景特殊处理**：`AiController` 中对 SSE 客户端断开导致的发送失败以 `log.debug` 记录，避免正常断连污染 error 日志。

### 前端（console.log 调试）
- 无统一日志抽象层，直接在组件中使用 `console.log / console.error` 输出调试信息，常见于算法可视化组件（如 `AStarDetail.vue`、`BFSDetail.vue`）的步骤追踪。
- 归档中的 `log-console.js` 提供可选的控制台拦截方案：将 `console.log` 和 `console.error` 的输出追加到 `localStorage.consoleLogs`，并通过 `log-viewer.html` 页面读取展示，用于离线调试。
- 该方案未被纳入主工程（`src/` 中未引用 `archive/log-console.js`），仅作为历史调试工具保留在 `archive/`。

## 4. 约定与约束

- **包级日志开关**：生产环境可通过环境变量或部署配置调整 `logging.level.root`，当前默认 root=INFO，`com.suanfa` 包=DEBUG。
- **日志内容规范**：所有日志均使用 SLF4J 参数化占位符（`{}`），禁止字符串拼接；异常堆栈通过 `log.error("...", e)` 形式完整记录。
- **异常分类**：业务可预期异常（如接口不存在、请求体解析失败）使用 `log.warn`；不可预期的服务器内部错误使用 `log.error`。
- **前端无强制日志规范**：目前未对 `console.*` 的使用做 ESLint 规则限制，也未建立统一的前端日志上报机制；如需在生产环境收集前端日志，需额外引入 SDK 或接入后端 API。
- **日志存储**：后端依赖 Spring Boot 默认的 Logback 输出（控制台/文件取决于运行环境），未在代码中自定义 Appender；前端日志仅存在于浏览器内存或归档脚本的 localStorage 中，无持久化方案。
