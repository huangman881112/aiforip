---
kind: error_handling
name: Spring Boot 全局异常处理与前后端统一错误响应体系
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/main/java/com/suanfa/config/GlobalExceptionHandler.java
    - backend/src/main/java/com/suanfa/service/AiChatService.java
    - backend/src/main/java/com/suanfa/security/JwtAuthFilter.java
    - backend/src/main/java/com/suanfa/config/DataInitializer.java
    - suanfa_vue/src/api/client.js
---

## 1. 整体方案

后端采用 Spring Boot 的 `@RestControllerAdvice` + `@ExceptionHandler` 集中式异常处理，所有 HTTP 层抛出的异常最终被 `GlobalExceptionHandler` 捕获并转换为统一的 JSON 错误体；前端通过统一的 `fetch` 封装在 `suanfa_vue/src/api/client.js` 中把非 `2xx` 响应包装为带 `status` 字段的 `Error` 对象，并在业务调用处按状态码做降级或提示。

## 2. 后端核心：全局异常处理器

- **文件**：`backend/src/main/java/com/suanfa/config/GlobalExceptionHandler.java`
- **机制**：使用 `@RestControllerAdvice` 注册多个 `@ExceptionHandler`，覆盖以下场景：
  - `IllegalArgumentException` → 400 Bad Request，消息直接透传（用于参数校验失败）。
  - `HttpRequestMethodNotSupportedException` → 405 Method Not Allowed，附带支持的 HTTP 方法列表。
  - `NoResourceFoundException` / `NoHandlerFoundException` → 404 Not Found，提示「接口不存在（后端版本可能过旧）」。
  - `HttpMessageNotReadableException` / `MissingServletRequestParameterException` → 400，截断换行后的首行作为短消息。
  - 兜底 `Exception` → 500 Internal Server Error，记录完整堆栈日志，返回类名。
- **统一响应体**：内部 record `ErrorBody(String message)`，所有错误以 `{ "message": "..." }` 形式返回，便于前端统一解析。
- **设计约束**：注释明确要求「路由类异常必须原样返回状态码，否则会被兜底的 500 吞掉」，因此 400/404/405 等客户端错误不会上抛到通用 500 分支。

## 3. 业务层自定义异常

- **`AiChatService.AiException`**：继承 `RuntimeException`，携带 `cooldownSeconds` 字段，用于上游 AI 服务不可用、限流、超时等可诊断错误。上层控制器根据该异常的 `cooldownSeconds` 决定是否对模型进行熔断冷却。
- **`AiChatService.ClientDisconnectedException`**：继承自 `AiException`，表示用户主动中断 SSE 流，不触发熔断、不切换备用模型。
- 这些异常由 `AiController` 中的 `try/catch` 显式捕获后转为合适的 HTTP 状态码（如 429 限流保留给前端显示），其余未捕获异常再交由 `GlobalExceptionHandler` 兜底。

## 4. 安全过滤器中的错误处理

- `JwtAuthFilter`（`OncePerRequestFilter`）仅解析 cookie 中的 JWT 并把 `userId` 注入 request attribute，**不拦截、不抛异常**；鉴权失败由 Controller 层判断 `@CurrentUserId` 是否为 null 后返回 401。
- `JwtService.parse()` 中对解析异常使用 `catch (Exception e)` 静默返回 null，避免非法 token 导致整个请求链路崩溃。

## 5. 启动初始化中的容错

- `DataInitializer` 实现 `CommandLineRunner`，启动时导入算法元数据种子和默认管理员账号。
- 对 MongoDB 连接失败使用 `try/catch(Exception)` 降级：记录 warn 日志并跳过内容种子导入，不影响站点基本功能。

## 6. 前端错误处理与降级策略

- **统一请求封装**：`client.js` 的 `request()` 函数对非 `res.ok` 响应构造 `new Error(body?.message || '请求失败 (status)')`，并附加 `err.status = res.status`，调用方可按状态码区分处理。
- **SSE 流式错误**：`aiChatStream()` 单独处理 `AbortError`、401/403（降级本地答疑）、404/405（回退非流式 `/ai/chat`）、503（AI 未配置，走本地答疑），其他错误通过 `httpError()` 包装后抛出。
- **后端不可达探测**：`checkBackend()` 缓存后端可用性（成功永久缓存，失败 30s 负缓存），多数 API 先探测再决定走后端还是 localStorage 本地回退。
- **具体降级点**：算法详情、笔记、评论、训练记录、代码执行、AI 聊天等模块在后端不可达或路由不存在时均回退到 `localStorage` 或内置数据，保证纯静态部署可用。

## 7. 约定与约束

- 后端所有 REST 接口不得自行 `ResponseEntity.error(...)`，应抛出异常交由 `GlobalExceptionHandler` 统一格式化。
- 业务层抛出自定义异常（如 `AiException`）时必须包含对用户可读的错误信息，因为该信息会经控制器透传到前端。
- 前端不得直接展示后端原始异常堆栈，只读取 `error.message` 和 `error.status`。
- 对于历史兼容问题（如旧后端无某路由），前端通过捕获 404/405/500 等状态码主动回退到旧接口或本地模式，而非依赖后端返回特定错误码。
- 启动阶段允许静默降级（MongoDB 不可用跳过种子导入），但运行时 API 错误必须向上冒泡至全局处理器。