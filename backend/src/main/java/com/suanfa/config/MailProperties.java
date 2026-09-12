package com.suanfa.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 邮件服务配置（{@code suanfa.mail.*}）：用于「修改密码」等场景的邮箱验证码投递。
 *
 * <p>本站没有独立的 spring.mail 自动配置依赖：host 为空即视为「未接入 SMTP」，
 * 此时 {@link com.suanfa.service.MailService} 只把验证码写进日志（配合
 * {@code dev-echo-code} 把验证码回传给前端），本地开发无需真实邮箱也能跑通流程。
 */
@Component
@ConfigurationProperties(prefix = "suanfa.mail")
public class MailProperties {

    /** SMTP 服务器地址；留空 = 不真正发信（降级为日志模式）。 */
    private String host = "";
    private int port = 465;
    /** 登录账号（多数服务商就是发件邮箱本身）。 */
    private String username = "";
    /** 登录密码 / 授权码（QQ、163 等要填「SMTP 授权码」而不是登录密码）。 */
    private String password = "";
    /** 发件人；留空则取 username。 */
    private String from = "";
    /** true = 隐式 SSL（常见 465）；false = 明文 + STARTTLS（常见 25/587）。 */
    private boolean ssl = true;
    /** 明文连接时是否启用 STARTTLS（ssl=false 才生效）。 */
    private boolean starttls = true;
    private int timeoutSeconds = 10;

    /** 验证码邮件主题。 */
    private String subject = "【小白学算法】邮箱验证码";
    /** 验证码有效期（秒）。 */
    private int codeTtlSeconds = 600;
    /** 同一用户+邮箱的重发间隔（秒）。 */
    private int resendCooldownSeconds = 60;
    /** 单个验证码最多校验尝试次数，超过即作废。 */
    private int maxAttempts = 5;
    /**
     * 未配置 SMTP 时，把验证码随接口响应回传给前端（仅本地开发便利；生产务必置 false）。
     * 一旦配了 host，本开关不起作用——真实发信时绝不外泄验证码。
     */
    private boolean devEchoCode = true;

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public boolean isSsl() {
        return ssl;
    }

    public void setSsl(boolean ssl) {
        this.ssl = ssl;
    }

    public boolean isStarttls() {
        return starttls;
    }

    public void setStarttls(boolean starttls) {
        this.starttls = starttls;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public int getCodeTtlSeconds() {
        return codeTtlSeconds;
    }

    public void setCodeTtlSeconds(int codeTtlSeconds) {
        this.codeTtlSeconds = codeTtlSeconds;
    }

    public int getResendCooldownSeconds() {
        return resendCooldownSeconds;
    }

    public void setResendCooldownSeconds(int resendCooldownSeconds) {
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public boolean isDevEchoCode() {
        return devEchoCode;
    }

    public void setDevEchoCode(boolean devEchoCode) {
        this.devEchoCode = devEchoCode;
    }

    /** 发件人（from 缺省时回落到 username）。 */
    public String resolvedFrom() {
        if (from != null && !from.isBlank()) {
            return from.trim();
        }
        return username == null ? "" : username.trim();
    }
}
