# 认证授权API

<cite>
**本文引用的文件**
- [AuthController.java](file://backend/src/main/java/com/suanfa/controller/AuthController.java)
- [AuthService.java](file://backend/src/main/java/com/suanfa/service/AuthService.java)
- [EmailCodeService.java](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java)
- [MailService.java](file://backend/src/main/java/com/suanfa/service/MailService.java)
- [AdminGuard.java](file://backend/src/main/java/com/suanfa/service/AdminGuard.java)
- [JwtService.java](file://backend/src/main/java/com/suanfa/security/JwtService.java)
- [JwtAuthFilter.java](file://backend/src/main/java/com/suanfa/security/JwtAuthFilter.java)
- [AuthRequest.java](file://backend/src/main/java/com/suanfa/dto/AuthRequest.java)
- [ChangePasswordRequest.java](file://backend/src/main/java/com/suanfa/dto/ChangePasswordRequest.java)
- [ChangeEmailRequest.java](file://backend/src/main/java/com/suanfa/dto/ChangeEmailRequest.java)
- [EmailCodeRequest.java](file://backend/src/main/java/com/suanfa/dto/EmailCodeRequest.java)
- [UserResponse.java](file://backend/src/main/java/com/suanfa/dto/UserResponse.java)
- [User.java](file://backend/src/main/java/com/suanfa/entity/User.java)
- [MailProperties.java](file://backend/src/main/java/com/suanfa/config/MailProperties.java)
- [application.yml](file://backend/src/main/resources/application.yml)
- [client.js](file://suanfa_vue/src/api/client.js)
- [Login.vue](file://suanfa_vue/src/components/common/Login.vue)
- [ChangePasswordPage.vue](file://suanfa_vue/src/components/common/ChangePasswordPage.vue)
- [ChangeEmailPage.vue](file://suanfa_vue/src/components/common/ChangeEmailPage.vue)
- [user.js](file://suanfa_vue/src/stores/user.js)
</cite>

## 更新摘要
**变更内容**
- 新增注册邮箱验证码发送接口 `/api/auth/register/email-code`，支持注册时可选邮箱验证
- 新增注册验证码即时校验接口 `/api/auth/register/verify-code`，提供实时反馈体验
- 新增修改绑定邮箱功能，包含验证码发送 `/api/auth/email-code/change` 和邮箱修改 `/api/auth/email`
- 实现IP限流机制防止验证码滥用，10分钟内同一IP最多发送5次验证码
- 增强密码修改接口，支持通过邮箱验证码进行二次身份验证
- 完善前端邮箱修改界面，包含完整的验证码流程和用户体验优化

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细接口说明](#详细接口说明)
6. [依赖关系分析](#依赖关系分析)
7. [性能与安全考虑](#性能与安全考虑)
8. [故障排查指南](#故障排查指南)
9. [结论](#结论)
10. [附录：前端实现指南](#附录：前端实现指南)

## 简介
本文件为认证授权模块的完整技术文档，覆盖用户注册、登录、登出与获取当前用户等基础接口；详细说明JWT令牌的生成、解析与过期策略；新增邮箱验证码验证和密码修改功能；支持注册时可选邮箱验证；实现IP限流防止验证码滥用；提供角色-based授权机制（管理员和普通用户）；给出HTTP方法、URL模式、请求参数、响应格式及成功/失败示例；并提供安全建议与前端最佳实践（令牌存储、自动刷新、会话恢复）。

## 项目结构
认证相关后端由控制器、服务、安全过滤器与JWT工具组成；新增邮件服务和邮箱验证码服务；前端通过统一的API客户端调用并维护用户状态，包含完整的密码修改和邮箱修改界面。

```mermaid
graph TB
subgraph "前端"
A["Login.vue"]
B["ChangePasswordPage.vue"]
C["ChangeEmailPage.vue"]
D["stores/user.js"]
E["api/client.js"]
end
subgraph "后端"
F["AuthController.java"]
G["AuthService.java"]
H["JwtAuthFilter.java"]
I["JwtService.java"]
J["EmailCodeService.java"]
K["MailService.java"]
L["AdminGuard.java"]
M["UserRepository(外部)"]
N["MailProperties"]
end
A --> D --> E --> F
B --> E --> F
C --> E --> F
F --> G
F --> J
F --> K
F --> I
H --> I
G --> L
G --> M
J --> K
J --> N
```

**图表来源**
- [AuthController.java:31-365](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L31-L365)
- [AuthService.java:10-161](file://backend/src/main/java/com/suanfa/service/AuthService.java#L10-L161)
- [EmailCodeService.java:24-219](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L24-L219)
- [MailService.java:15-109](file://backend/src/main/java/com/suanfa/service/MailService.java#L15-L109)
- [AdminGuard.java:12-72](file://backend/src/main/java/com/suanfa/service/AdminGuard.java#L12-L72)

## 核心组件
- **AuthController**：暴露 /api/auth 下的注册、登录、登出、当前用户、邮箱验证码、密码修改、邮箱修改接口；负责设置/清除Cookie中的JWT；实现IP限流防止验证码滥用。
- **AuthService**：处理用户名唯一性校验、密码加密与比对、用户查询与DTO转换、密码修改验证、邮箱修改验证。
- **EmailCodeService**：管理邮箱验证码的生成、发送、验证和生命周期管理，支持重发限流和尝试次数限制，支持多种用途（注册、改密、换绑）。
- **MailService**：SMTP邮件发送服务，支持SSL/TLS配置，未配置时进入开发模式。
- **AdminGuard**：管理员权限判定，支持数据库角色和配置白名单双重机制。
- **JwtService**：基于HS256签发和解析JWT，支持从配置读取密钥与过期天数。
- **JwtAuthFilter**：从httpOnly Cookie中解析JWT，将userId注入请求属性，供受保护接口使用。

**章节来源**
- [AuthController.java:31-365](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L31-L365)
- [AuthService.java:10-161](file://backend/src/main/java/com/suanfa/service/AuthService.java#L10-L161)
- [EmailCodeService.java:24-219](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L24-L219)
- [MailService.java:15-109](file://backend/src/main/java/com/suanfa/service/MailService.java#L15-L109)
- [AdminGuard.java:12-72](file://backend/src/main/java/com/suanfa/service/AdminGuard.java#L12-L72)

## 架构总览
认证流程采用"服务端签发JWT并写入httpOnly Cookie"的模式。新增的邮箱验证码系统提供二次身份验证，确保密码修改和邮箱修改的安全性。管理员权限系统支持基于角色的访问控制。IP限流机制有效防止验证码滥用攻击。

```mermaid
sequenceDiagram
participant FE as "前端"
participant API as "AuthController"
participant SVC as "AuthService"
participant EMAIL as "EmailCodeService"
participant MAIL as "MailService"
participant JWT as "JwtService"
participant DB as "数据库"
Note over FE,DB : 注册邮箱验证码流程
FE->>API : POST /api/auth/register/email-code {email}
API->>EMAIL : send(null, PURPOSE_REGISTER, email)
EMAIL->>MAIL : send(to, subject, body)
MAIL-->>EMAIL : success/failure
EMAIL-->>API : SendResult
API-->>FE : {sent, mailConfigured, maskedEmail, expiresInSeconds, cooldownSeconds, devCode?}
Note over FE,DB : 修改绑定邮箱流程
FE->>API : POST /api/auth/email-code/change {email}
API->>EMAIL : send(userId, PURPOSE_CHANGE_EMAIL, email)
EMAIL->>MAIL : send(to, subject, body)
MAIL-->>EMAIL : success/failure
EMAIL-->>API : SendResult
API-->>FE : {sent, mailConfigured, maskedEmail, expiresInSeconds, cooldownSeconds, devCode?}
Note over FE,DB : 邮箱修改确认流程
FE->>API : PUT /api/auth/email {email, code, password}
API->>SVC : validateEmailChange(user, password)
SVC-->>API : validation result
API->>EMAIL : verify(userId, PURPOSE_CHANGE_EMAIL, email, code)
EMAIL-->>API : verification result
API->>SVC : applyEmailChange(userId, email)
SVC-->>API : updated user
API-->>FE : 200 + UserResponse
```

**图表来源**
- [AuthController.java:103-138](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L103-L138)
- [AuthController.java:231-270](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L231-L270)
- [AuthController.java:278-291](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L278-L291)
- [EmailCodeService.java:63-104](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L63-L104)
- [MailService.java:43-82](file://backend/src/main/java/com/suanfa/service/MailService.java#L43-L82)

## 详细接口说明

### 通用约定
- Base URL: /api
- 内容类型: application/json
- 认证方式: httpOnly Cookie（名称: token），跨域需允许凭据
- 统一错误体: { message: string }

**章节来源**
- [client.js:30-43](file://suanfa_vue/src/api/client.js#L30-L43)
- [AuthController.java:318-320](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L318-L320)

### 基础认证接口

#### 注册
- 方法: POST
- 路径: /api/auth/register
- 请求体:
  - username: string（必填）
  - password: string（必填，至少4位）
  - email: string（可选，填了则必须配合验证码）
  - code: string（可选，仅当填写email时必填）
- 成功响应: 200
  - 主体: UserResponse（包含id, username, displayName, email, createdAt, role, admin, membershipActive, membershipExpireAt）
  - Set-Cookie: token=...; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax
- 失败响应:
  - 409 Conflict: { message: "用户名已存在" }
  - 400 Bad Request: { message: "用户名不能为空且密码至少 4 位" } 或 { message: "该邮箱已被其他账号绑定，请换一个或直接登录" } 或 { message: "请先获取邮箱验证码" }

#### 登录
- 方法: POST
- 路径: /api/auth/login
- 请求体:
  - username: string（必填）
  - password: string（必填）
- 成功响应: 200
  - 主体: UserResponse（包含id, username, displayName, email, createdAt, role, admin, membershipActive, membershipExpireAt）
  - Set-Cookie: token=...; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax
- 失败响应:
  - 401 Unauthorized: { message: "用户名或密码错误" }

#### 登出
- 方法: POST
- 路径: /api/auth/logout
- 请求体: 无
- 成功响应: 200
- 行为: 清除token Cookie

#### 获取当前用户
- 方法: GET
- 路径: /api/auth/me
- 认证: 需要有效的token Cookie
- 成功响应: 200
  - 主体: UserResponse（包含id, username, displayName, email, createdAt, role, admin, membershipActive, membershipExpireAt）
- 失败响应:
  - 401 Unauthorized: { message: "未登录" }

### 新增注册邮箱验证码接口

#### 发送注册邮箱验证码
- 方法: POST
- 路径: /api/auth/register/email-code
- 认证: 无需登录（公开接口）
- 请求体:
  - email: string（必填，邮箱格式）
- 成功响应: 200
  - 主体: { sent: boolean, mailConfigured: boolean, maskedEmail: string, expiresInSeconds: number, cooldownSeconds: number, devCode?: string }
  - devCode字段仅在开发模式（未配置SMTP）时返回
- 失败响应:
  - 400 Bad Request: { message: "请输入邮箱" } 或 { message: "邮箱格式不正确" } 或 { message: "该邮箱已被其他账号绑定，请直接登录" }
  - 429 Too Many Requests: { message: "验证码发送过于频繁，请 10 分钟后再试" }
  - 502 Bad Gateway: { message: "邮件发送失败..." }

#### 即时校验注册验证码
- 方法: POST
- 路径: /api/auth/register/verify-code
- 认证: 无需登录（公开接口）
- 请求体:
  - email: string（必填，邮箱格式）
  - code: string（可选，验证码）
- 成功响应: 200
  - 主体: { verified: true }
- 失败响应:
  - 400 Bad Request: { message: "请输入邮箱" } 或 { message: "邮箱格式不正确" } 或 { message: "请先获取邮箱验证码" } 或 { message: "验证码已过期，请重新获取" } 或 { message: "验证码不正确，还可尝试 X 次" }

**章节来源**
- [AuthController.java:103-138](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L103-L138)
- [AuthController.java:77-94](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L77-L94)

### 新增修改绑定邮箱接口

#### 发送修改绑定邮箱验证码
- 方法: POST
- 路径: /api/auth/email-code/change
- 认证: 需要有效的token Cookie
- 请求体:
  - email: string（必填，新邮箱格式）
- 成功响应: 200
  - 主体: { sent: boolean, mailConfigured: boolean, maskedEmail: string, expiresInSeconds: number, cooldownSeconds: number, devCode?: string }
  - devCode字段仅在开发模式（未配置SMTP）时返回
- 失败响应:
  - 401 Unauthorized: { message: "未登录" }
  - 400 Bad Request: { message: "请输入新邮箱" } 或 { message: "邮箱格式不正确" } 或 { message: "新邮箱不能与当前绑定的邮箱相同" } 或 { message: "该邮箱已被其他账号绑定，请换一个" }
  - 502 Bad Gateway: { message: "邮件发送失败..." }

#### 修改绑定邮箱
- 方法: PUT
- 路径: /api/auth/email
- 认证: 需要有效的token Cookie
- 请求体:
  - email: string（必填，新邮箱）
  - code: string（必填，新邮箱验证码）
  - password: string（必填，当前登录密码）
- 成功响应: 200
  - 主体: UserResponse（包含更新后的用户信息和新绑定的邮箱）
- 失败响应:
  - 401 Unauthorized: { message: "未登录" }
  - 400 Bad Request: { message: "当前密码不正确" } 或 { message: "该邮箱已被其他账号绑定，请换一个邮箱并重新获取验证码" }

**章节来源**
- [AuthController.java:231-270](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L231-L270)
- [AuthController.java:278-291](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L278-L291)

### 密码修改接口

#### 发送修改密码邮箱验证码
- 方法: POST
- 路径: /api/auth/email-code
- 认证: 需要有效的token Cookie
- 请求体:
  - email: string（必填，邮箱格式）
- 成功响应: 200
  - 主体: { sent: boolean, mailConfigured: boolean, maskedEmail: string, expiresInSeconds: number, cooldownSeconds: number, devCode?: string }
  - devCode字段仅在开发模式（未配置SMTP）时返回
- 失败响应:
  - 401 Unauthorized: { message: "未登录" }
  - 400 Bad Request: { message: "邮箱格式不正确" }
  - 502 Bad Gateway: { message: "邮件发送失败..." }

#### 修改密码
- 方法: PUT
- 路径: /api/auth/password
- 认证: 需要有效的token Cookie
- 请求体:
  - oldPassword: string（必填，原密码）
  - newPassword: string（必填，新密码至少6位）
  - email: string（可选，用于绑定的邮箱）
  - code: string（必填，邮箱验证码）
- 成功响应: 200
  - 主体: UserResponse（包含更新后的用户信息和新绑定的邮箱）
  - Set-Cookie: token=...; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax（重新签发新令牌）
- 失败响应:
  - 401 Unauthorized: { message: "未登录" }
  - 400 Bad Request: { message: "原密码不正确" } 或 { message: "新密码至少 6 位" } 或 { message: "新密码不能与原密码相同" } 或 { message: "请输入邮箱验证码" } 或 { message: "验证码已过期，请重新获取" } 或 { message: "验证码错误次数过多，请重新获取" }
  - 502 Bad Gateway: { message: "邮件发送失败..." }

**章节来源**
- [AuthController.java:173-196](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L173-L196)
- [AuthController.java:204-222](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L204-L222)

### 请求与响应示例

#### 发送注册邮箱验证码
- 请求:
  - POST /api/auth/register/email-code
  - Content-Type: application/json
  - Body: { "email": "user@example.com" }
- 成功响应:
  - 200 OK
  - Body: { "sent": true, "mailConfigured": true, "maskedEmail": "us***@example.com", "expiresInSeconds": 600, "cooldownSeconds": 60 }
- 开发模式响应:
  - 200 OK
  - Body: { "sent": false, "mailConfigured": false, "devCode": "123456", "expiresInSeconds": 600, "cooldownSeconds": 60 }

#### 发送修改绑定邮箱验证码
- 请求:
  - POST /api/auth/email-code/change
  - Content-Type: application/json
  - Body: { "email": "newuser@example.com" }
- 成功响应:
  - 200 OK
  - Body: { "sent": true, "mailConfigured": true, "maskedEmail": "ne***@example.com", "expiresInSeconds": 600, "cooldownSeconds": 60 }

#### 修改绑定邮箱
- 请求:
  - PUT /api/auth/email
  - Content-Type: application/json
  - Body: { "email": "newuser@example.com", "code": "123456", "password": "currentpass123" }
- 成功响应:
  - 200 OK
  - Body: { "id": 1, "username": "alice", "displayName": "Alice", "email": "newuser@example.com", "createdAt": "...", "role": "user", "admin": false, "membershipActive": false, "membershipExpireAt": null }

#### 用户响应格式
- UserResponse:
  - id: number（用户ID）
  - username: string（用户名）
  - displayName: string（显示名称）
  - email: string?（绑定的邮箱，可为空）
  - createdAt: string（创建时间）
  - role: string（角色：user 或 admin）
  - admin: boolean（是否为管理员）
  - membershipActive: boolean（会员是否有效）
  - membershipExpireAt: string?（会员到期时间）

**章节来源**
- [AuthController.java:58-71](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L58-L71)
- [AuthController.java:103-138](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L103-L138)
- [AuthController.java:231-270](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L231-L270)
- [AuthController.java:278-291](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L278-L291)
- [AuthService.java:152-159](file://backend/src/main/java/com/suanfa/service/AuthService.java#L152-L159)

## 依赖关系分析

```mermaid
classDiagram
class AuthController {
+register(req, response)
+login(req, response)
+logout(response)
+me(userId)
+sendRegisterEmailCode(req, request)
+verifyRegisterCode(req)
+sendEmailCode(userId, req)
+changePassword(userId, req, response)
+sendChangeEmailCode(userId, req)
+changeEmail(userId, req)
}
class AuthService {
+register(username, rawPassword, email, code) User
+login(username, rawPassword) User
+validatePasswordChange(user, oldPassword, newPassword) void
+applyPasswordChange(userId, newPassword, email) User
+validateEmailChange(user, password) void
+applyEmailChange(userId, email) User
+isEmailBound(email) boolean
+findById(id) Optional~User~
+toResponse(u) UserResponse
}
class EmailCodeService {
+send(userId, purpose, email) SendResult
+verify(userId, purpose, email, code) boolean
+check(userId, purpose, email, code) boolean
+invalidate(userId, purpose, email) void
}
class MailService {
+isConfigured() boolean
+send(to, subject, body) void
}
class AdminGuard {
+isAdmin(User) boolean
+isAdmin(Long) boolean
+countAdmins() int
}
class JwtService {
+generate(userId, username) String
+parse(token) Claims
+userId(claims) long
}
class JwtAuthFilter {
+doFilterInternal(request, response, chain)
}
class UserRepository {
+findByUsername(username) Optional~User~
+insert(username, passwordHash, email, role) long
+findById(id) Optional~User~
+updatePassword(userId, passwordHash, email) void
+updateEmail(userId, email) void
+emailTaken(email, excludeUserId) boolean
}
AuthController --> AuthService : "调用"
AuthController --> EmailCodeService : "调用"
AuthController --> MailService : "调用"
AuthController --> JwtService : "签发/解析"
JwtAuthFilter --> JwtService : "解析"
AuthService --> AdminGuard : "权限判定"
AuthService --> UserRepository : "访问"
EmailCodeService --> MailService : "发送邮件"
```

**图表来源**
- [AuthController.java:31-365](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L31-L365)
- [AuthService.java:10-161](file://backend/src/main/java/com/suanfa/service/AuthService.java#L10-L161)
- [EmailCodeService.java:24-219](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L24-L219)
- [MailService.java:15-109](file://backend/src/main/java/com/suanfa/service/MailService.java#L15-L109)
- [AdminGuard.java:12-72](file://backend/src/main/java/com/suanfa/service/AdminGuard.java#L12-L72)

**章节来源**
- [AuthController.java:31-365](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L31-L365)
- [AuthService.java:10-161](file://backend/src/main/java/com/suanfa/service/AuthService.java#L10-L161)
- [EmailCodeService.java:24-219](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L24-L219)
- [MailService.java:15-109](file://backend/src/main/java/com/suanfa/service/MailService.java#L15-L109)
- [AdminGuard.java:12-72](file://backend/src/main/java/com/suanfa/service/AdminGuard.java#L12-L72)

## 性能与安全考虑

### 密码安全
- 使用BCrypt对密码进行哈希存储，避免明文保存。
- 登录时通过匹配器验证原始密码与哈希值。
- 密码修改前验证原密码正确性和新密码强度。

### 邮箱验证码安全
- 验证码存储在内存中（ConcurrentHashMap），重启后自动失效。
- 验证码有效期默认600秒（可配置）。
- 重发冷却时间默认60秒（可配置）。
- 最大尝试次数默认5次（可配置）。
- 验证码一次性使用，验证后立即删除。
- 开发模式下可选择是否回显验证码到响应。
- 验证码按用途分类（注册、改密、换绑），防止跨场景复用。

### IP限流防滥用
- 注册邮箱验证码接口实现IP滑动窗口限流。
- 10分钟内同一IP最多发送5次验证码。
- 使用ConcurrentHashMap存储IP访问记录。
- 自动清理过期的IP记录，防止内存泄漏。
- 有效防止恶意刷信攻击。

### 令牌机制
- 算法: HS256，subject为用户ID，claim包含username。
- 有效期: 由配置项 suafa.jwt.expiry-days 控制（默认7天）。
- 传输与存储: 通过httpOnly Cookie下发，降低XSS窃取风险；SameSite=Lax缓解CSRF风险。
- 解析: 过滤器从Cookie中读取并解析，无效或过期返回null，不拦截但交由业务层判定。
- 密码修改后重新签发新令牌。

### 权限控制
- 支持两种管理员身份：数据库角色（users.role='admin'）和配置白名单（suanfa.ai.admin-usernames）。
- 管理员判定逻辑收口在AdminGuard服务中。
- 当前设计在Controller层通过请求属性判断是否已登录；如需细粒度权限，可在过滤器或注解层扩展。

### 邮件服务配置
- 支持SSL和STARTTLS连接。
- 未配置SMTP时进入开发模式，验证码仅写日志。
- 生产环境必须配置有效的SMTP服务器。

**章节来源**
- [AuthService.java:24-45](file://backend/src/main/java/com/suanfa/service/AuthService.java#L24-L45)
- [AuthService.java:84-97](file://backend/src/main/java/com/suanfa/service/AuthService.java#L84-L97)
- [AuthService.java:120-127](file://backend/src/main/java/com/suanfa/service/AuthService.java#L120-L127)
- [EmailCodeService.java:63-104](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L63-L104)
- [EmailCodeService.java:132-160](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L132-L160)
- [AuthController.java:51-52](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L51-L52)
- [AuthController.java:118-121](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L118-L121)
- [AuthController.java:326-354](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L326-L354)
- [MailService.java:32-82](file://backend/src/main/java/com/suanfa/service/MailService.java#L32-L82)
- [AdminGuard.java:52-65](file://backend/src/main/java/com/suanfa/service/AdminGuard.java#L52-L65)
- [application.yml:18-70](file://backend/src/main/resources/application.yml#L18-L70)

## 故障排查指南

### 认证相关问题
- **401 未登录**: 检查Cookie是否存在、Token是否过期、过滤器是否正确解析。
- **409 用户名已存在**: 重复注册，提示用户更换用户名或引导登录。
- **400 参数校验失败**: 用户名空或密码长度不足，前端增加输入校验。

### 邮箱验证码问题
- **邮箱格式不正确**: 检查邮箱格式是否符合正则表达式。
- **验证码发送过于频繁**: 等待冷却时间后再试。
- **验证码已过期**: 重新获取验证码。
- **验证码错误次数过多**: 验证码被作废，需要重新获取。
- **邮件发送失败**: 检查SMTP配置和网络连接。
- **IP限流触发**: 10分钟内同一IP发送超过5次，需要等待重置。

### 邮箱修改问题
- **新邮箱与当前相同**: 无法换绑到相同邮箱。
- **新邮箱已被占用**: 选择其他邮箱或联系管理员。
- **当前密码不正确**: 确认输入的当前密码正确。
- **验证码问题**: 确保先获取验证码，再在规定时间内使用。

### 权限相关问题
- **管理员功能不可用**: 检查用户角色或是否在配置白名单中。
- **数据不一致**: 确认AdminGuard的判定逻辑和用户数据同步。

**章节来源**
- [AuthController.java:58-71](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L58-L71)
- [AuthController.java:103-138](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L103-L138)
- [AuthController.java:231-270](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L231-L270)
- [AuthController.java:278-291](file://backend/src/main/java/com/suanfa/controller/AuthController.java#L278-L291)
- [EmailCodeService.java:63-104](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L63-L104)
- [EmailCodeService.java:132-160](file://backend/src/main/java/com/suanfa/service/EmailCodeService.java#L132-L160)
- [MailService.java:43-82](file://backend/src/main/java/com/suanfa/service/MailService.java#L43-L82)

## 结论
该认证方案以httpOnly Cookie承载JWT为核心，结合BCrypt密码哈希、邮箱验证码二次验证和可配置的令牌有效期，实现了安全的注册、登录、登出、密码修改、邮箱修改与会话恢复功能。新增的注册邮箱验证、邮箱修改功能和IP限流机制显著提升了系统的安全性和抗攻击能力。完善的角色授权机制支持管理员和普通用户的差异化权限控制。前端通过完整的密码修改和邮箱修改界面以及统一客户端封装了凭据传递与错误处理，便于集成与维护。

## 附录：前端实现指南

### 基础调用
- 使用提供的API客户端函数：register、login、logout、fetchCurrentUser、sendRegisterEmailCode、verifyRegisterCode、sendEmailCode、changePassword、sendChangeEmailCode、changeEmail。
- 所有请求均附带credentials: 'include'，确保Cookie随请求发送。

### 登录态初始化
- 应用启动时调用init()拉取当前用户，若失败则视为未登录。
- 支持管理员状态检测：userStore.isAdmin。

### 注册流程（含邮箱验证）
- **步骤1**: 用户输入用户名、密码和可选邮箱。
- **步骤2**: 如果填写邮箱，调用sendRegisterEmailCode(email)发送验证码。
- **步骤3**: 可选：调用verifyRegisterCode(email, code)进行即时验证。
- **步骤4**: 用户输入验证码并提交注册。
- **步骤5**: 成功后自动登录并跳转到主页。

### 密码修改流程
- **步骤1**: 调用sendEmailCode(email)发送验证码。
- **步骤2**: 处理响应，开发模式下自动填充devCode。
- **步骤3**: 用户输入验证码、原密码和新密码。
- **步骤4**: 调用changePassword({email, code, oldPassword, newPassword})提交修改。
- **步骤5**: 成功后刷新用户状态，显示绑定邮箱。

### 邮箱修改流程
- **步骤1**: 调用sendChangeEmailCode(newEmail)发送验证码到新邮箱。
- **步骤2**: 处理响应，开发模式下自动填充devCode。
- **步骤3**: 用户输入验证码和当前密码。
- **步骤4**: 调用changeEmail({email, code, password})提交修改。
- **步骤5**: 成功后刷新用户状态，显示新绑定的邮箱。

### 表单验证
- 邮箱格式验证：正则表达式检查。
- 验证码长度：固定6位数字。
- 密码强度：新密码至少6位，两次输入一致。
- 原密码验证：防止未授权密码修改。
- 邮箱唯一性：防止重复绑定。

### 用户体验优化
- 验证码倒计时：防止频繁发送。
- 开发模式支持：未配置SMTP时自动回显验证码。
- 即时验证：注册时支持输完验证码立即验证。
- 错误提示：详细的错误信息和操作指导。
- 状态反馈：发送中、提交中等加载状态。
- 智能提示：检测邮箱是否已被绑定、是否与当前邮箱相同。

### 令牌存储与刷新
- 令牌由服务端通过httpOnly Cookie管理，前端无需手动存取。
- 密码修改和邮箱修改后自动重新签发新令牌。
- 令牌过期后，受保护接口将返回401；建议在路由守卫或全局拦截器中检测401并引导重新登录。

### 跨域与安全性
- 开发阶段CORS可放宽，生产务必限制allowed-origins。
- 不要将token写入localStorage或sessionStorage，保持httpOnly策略。
- 邮箱验证码在生产环境不会回显到响应中。
- IP限流机制有效防止验证码滥用攻击。

**章节来源**
- [client.js:115-195](file://suanfa_vue/src/api/client.js#L115-L195)
- [user.js:21-55](file://suanfa_vue/src/stores/user.js#L21-L55)
- [ChangePasswordPage.vue:77-114](file://suanfa_vue/src/components/common/ChangePasswordPage.vue#L77-L114)
- [ChangeEmailPage.vue:59-118](file://suanfa_vue/src/components/common/ChangeEmailPage.vue#L59-L118)
- [application.yml:28-45](file://backend/src/main/resources/application.yml#L28-L45)