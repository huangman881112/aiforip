---
kind: configuration_system
name: Spring Boot 配置体系：application.yml + @ConfigurationProperties + 环境变量注入
category: configuration_system
scope:
    - '**'
source_files:
    - backend/src/main/resources/application.yml
    - backend/src/main/java/com/suanfa/config/AiProperties.java
    - backend/src/main/java/com/suanfa/config/WebConfig.java
    - backend/.env
    - backend/.env.example
    - backend/src/main/resources/schema.sql
---

## 1. 使用的系统与框架
- 后端基于 Spring Boot，使用 `application.yml` 作为主配置文件。
- 通过 `@ConfigurationProperties(prefix = "suanfa.*")` 将 YAML 节点绑定到 Java POJO（如 `AiProperties`），并通过 `@Value("${...}")` 在配置类中注入简单属性。
- 支持 Spring Boot 标准的环境变量覆盖语法 `${VAR:default}`，所有业务开关均可通过环境变量热替换。
- 前端为纯静态 SPA（Vite 构建产物），无运行时配置加载逻辑；其 API 地址由后端统一暴露，前端通过相对路径调用。

## 2. 关键文件与包
- `backend/src/main/resources/application.yml`：唯一集中式配置入口，定义 server、spring datasource/mongodb/jackson、自定义 `suanfa.*` 以及 logging 级别。
- `backend/src/main/java/com/suanfa/config/AiProperties.java`：AI 助教相关配置的强类型映射，包含单上游（旧写法）与多中转站（providers JSON）两种配置模式，并支持模型级 `maxTokens`/`timeoutSeconds`/`reasoningEffort`/`userVisible` 等细粒度参数。
- `backend/src/main/java/com/suanfa/config/WebConfig.java`：读取 `suanfa.cors.allowed-origins` 并注册 CORS 策略，同时注入 `CurrentUserIdResolver`。
- `backend/.env`：本地开发密钥与上游地址（已被 `.gitignore` 排除），配合 `scripts/dev-backend.sh` 的 `source` 行为生效。
- `backend/.env.example`：环境变量模板（用于提示必填项）。
- `backend/src/main/resources/schema.sql`：数据库初始化脚本，随 `spring.sql.init.mode=always` 自动执行。

## 3. 架构与约定
- **单一配置源**：所有运行时配置集中在 `application.yml`，按功能域分层——`server.*`、`spring.*`、`suanfa.*`、`logging.*`。
- **环境变量优先覆盖**：业务敏感配置（AI base-url、api-key、model、fallback-models、超时、限流阈值、CORS 白名单、JWT secret）一律采用 `${ENV_VAR:默认值}` 形式，生产环境通过环境变量覆盖，避免把密钥写入代码库。
- **强类型配置对象**：复杂配置（尤其是 AI 多中转站）通过 `@ConfigurationProperties` 绑定到 `AiProperties`，内部再嵌套 `Provider`、`Model` 两个静态类，提供 getter/setter，便于被 Service 直接消费。
- **双模 AI 配置兼容**：`AiProperties` 同时支持“旧写法”（`base-url/api-key/model/fallback-models` 字符串短语法 `name@maxTokens@timeoutSeconds@reasoningEffort`）和“新写法”（`providers` 列表或 `providers-json` JSON 数组），后者可写在环境变量中，优先级高于 yml 中的 `providers`。
- **安全配置外置**：`suanfa.jwt.secret` 注释明确要求“生产环境必须通过环境变量覆盖”，JWT cookie 过期天数 `expiry-days` 也归入同一命名空间。
- **CORS 动态化**：`WebConfig` 从 `suanfa.cors.allowed-origins` 读取逗号分隔来源，用 `allowedOriginPatterns` 而非 `allowedOrigins`，从而允许开发时 `*` 与 `allowCredentials(true)` 共存。
- **数据初始化**：`spring.sql.init.mode=always` + `schema-locations=classpath:schema.sql`，每次启动都执行建表脚本；MongoDB URI 通过 `spring.data.mongodb.uri` 配置。
- **日志级别**：根日志 `info`，应用包 `com.suanfa` 设为 `debug`，便于开发期排查。

## 4. 约定与约束
- **敏感信息不得硬编码**：`application.yml` 中 JWT secret、AI api-key 等均以 `${ENV:默认}` 形式存在，且注释强调生产必须通过环境变量覆盖。
- **开发默认宽松、生产收紧**：CORS 默认 `"*"`、AI 默认指向局域网中转站、AI 知识召回默认开启，均标注“生产环境通过环境变量覆盖”。
- **管理员能力受白名单控制**：`suanfa.ai.admin-usernames`（默认 `admin`）决定哪些用户可在「AI 助教」页面修改中转站配置、看到全量模型；未登录则无法获取任何模型信息。
- **AI 降级链约定**：`fallback-models` 支持 `name@maxTokens@timeoutSeconds@reasoningEffort` 四段短语法，按顺序尝试；当主模型不可用时自动回退到本地 Ollama/llama.cpp 兜底。
- **代码工作台限制**：`suanfa.code.compile-timeout-seconds`、`run-timeout-seconds`、`rate-per-minute` 控制手动测试执行的超时与频率，<=0 表示关闭。
- **前端无运行时配置**：Vue 前端通过 Vite 构建为静态资源，不读取 `.env` 或 `process.env`；所有后端交互走 `/api/**` 相对路径，由部署层代理或同源部署解决跨域问题。
- **`.env` 仅本地开发**：`backend/.env` 已加入 `.gitignore`，由 `scripts/dev-backend.sh` 在执行前 `source` 加载，不进入版本控制。