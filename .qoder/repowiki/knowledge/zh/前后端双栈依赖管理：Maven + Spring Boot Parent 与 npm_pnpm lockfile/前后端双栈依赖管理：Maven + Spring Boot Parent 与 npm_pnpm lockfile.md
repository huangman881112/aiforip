---
kind: dependency_management
name: 前后端双栈依赖管理：Maven + Spring Boot Parent 与 npm/pnpm lockfile
category: dependency_management
scope:
    - '**'
source_files:
    - backend/pom.xml
    - suanfa_vue/package.json
    - suanfa_vue/package-lock.json
---

## 1. 使用的系统/方案

本仓库为前后端一体化工程，分别采用两套独立的依赖管理系统：

- **后端（Java/Spring Boot）**：使用 Maven 作为构建与依赖解析工具，通过 `backend/pom.xml` 声明所有依赖，并继承 `spring-boot-starter-parent:3.2.0` 统一管理 Spring 生态的 BOM 版本。
- **前端（Vue 3 + Vite）**：使用 npm（lockfileVersion 3）作为包管理器，通过 `suanfa_vue/package.json` 声明运行时与开发时依赖，并通过 `package-lock.json` 锁定完整依赖树。

## 2. 关键文件

- `backend/pom.xml`：后端唯一依赖清单，定义 Java 17、Spring Boot 3.2.0 以及各第三方库。
- `suanfa_vue/package.json`：前端依赖清单，声明 Vue、Pinia、Vue Router、Vite 等。
- `suanfa_vue/package-lock.json`：前端依赖锁定文件，记录每个包的精确版本、完整性校验（integrity）与镜像源（`https://registry.npmmirror.com`）。
- `backend/target/`：Maven 构建产物目录（当前为空，说明尚未执行 `mvn package`），无 vendored 依赖。

## 3. 架构与约定

### 后端（Maven）
- 通过 `<parent>` 继承 `spring-boot-starter-parent`，由父 POM 统一管控 Spring、Jackson、Tomcat 等传递依赖的版本，避免在子模块中重复声明版本号。
- 仅对非 Spring 生态且存在多版本的库显式指定版本：如 `sqlite-jdbc:3.45.3.0`、`jjwt-api/impl/jackson:0.11.5`。
- 依赖范围明确区分：测试依赖使用 `<scope>test</scope>`（`spring-boot-starter-test`），JWT 实现类使用 `<scope>runtime</scope>`，生产运行仅需 API。
- 未配置私有 Maven 仓库或 `settings.xml`，默认从 Maven Central 拉取；SQLite 驱动直接以 JDBC 方式引入，注释说明“无 Hibernate，避免方言兼容问题”。
- 未使用 `maven-dependency-plugin` 进行依赖打包到 `target/` 之外的独立目录，也未启用 `maven-shade-plugin` 做 fat jar 外的特殊处理。

### 前端（npm）
- 使用 npm 的 lockfile v3（`package-lock.json`），锁定每个依赖的精确版本与 integrity hash，保证跨环境可重现安装。
- 依赖来源为国内镜像 `https://registry.npmmirror.com`（由 lockfile 中的 `resolved` 字段可见），表明本地可能配置了 `.npmrc` 指向该镜像。
- 依赖分为两类：`dependencies`（dompurify、marked、pinia、vue、vue-router）与 `devDependencies`（@vitejs/plugin-vue、vite），职责清晰。
- 未使用 pnpm/yarn，也没有 `pnpm-lock.yaml` 或 `yarn.lock`。

## 4. 约定与约束

- **版本策略**：后端核心框架通过 Spring Boot Parent 集中管理，业务层仅对少数第三方库显式声明版本；前端使用 `^` 语义化版本前缀，允许小版本自动升级，但通过 lockfile 固定实际安装版本。
- **无 vendoring**：Java 依赖通过 Maven 远程仓库下载至本地缓存（`.m2`），不将 `jar` 文件提交到仓库；Node 依赖通过 `node_modules/` 安装，且 `node_modules/` 已在 `.gitignore` 中忽略，不纳入版本控制。
- **无私有仓库/代理配置**：未在仓库内发现 `~/.m2/settings.xml`、`.npmrc`、`pom.xml` 中的 `<repositories>` 或 `<pluginRepositories>` 自定义段，依赖均走公共源（Maven Central / npm mirror）。
- **安全校验**：前端 lockfile 包含每个包的 `integrity` 字段，用于在安装时校验包完整性，防止篡改。
- **构建插件**：后端仅启用 `spring-boot-maven-plugin`，用于打包可执行 JAR；未发现其他依赖扫描、漏洞检测或自动化升级插件（如 Dependabot、Renovate）的配置。
