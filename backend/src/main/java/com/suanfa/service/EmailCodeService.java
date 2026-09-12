package com.suanfa.service;

import com.suanfa.config.MailProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * 邮箱验证码：发送（含重发限流）与校验（含尝试次数上限、一次性消费）。
 *
 * <p>验证码保存在进程内（{@link ConcurrentHashMap}），不落库：本站是单实例部署，
 * 重启后旧验证码作废反而是更安全的行为。校验成功即删除，避免重放。
 *
 * <p>未配置 SMTP（{@link MailService#isConfigured()} 为 false）时进入「开发模式」：
 * 验证码写日志，并按 {@code suanfa.mail.dev-echo-code} 决定是否随响应回传给前端，
 * 这样本地没有邮箱也能把「修改密码 → 邮箱验证码」整条链路跑通。
 */
@Service
public class EmailCodeService {

    private static final Logger log = LoggerFactory.getLogger(EmailCodeService.class);

    /** 用途：修改密码。验证码与用途绑定，防止跨场景复用。 */
    public static final String PURPOSE_CHANGE_PASSWORD = "change-password";

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final int MAX_EMAIL_LENGTH = 120;
    private static final int CODE_LENGTH = 6;

    private final MailService mailService;
    private final MailProperties props;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Code> store = new ConcurrentHashMap<>();

    public EmailCodeService(MailService mailService, MailProperties props) {
        this.mailService = mailService;
        this.props = props;
    }

    public static boolean isValidEmail(String email) {
        return email != null && email.length() <= MAX_EMAIL_LENGTH
                && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * 发送验证码。
     *
     * @param userId  当前登录用户
     * @param purpose 用途（见 {@code PURPOSE_*}）
     * @param email   收件邮箱
     * @return 发送结果（是否真实发信、开发模式下回传的验证码）
     * @throws IllegalArgumentException 邮箱格式非法 / 重发过于频繁
     * @throws MailService.MailSendException SMTP 已配置但发送失败
     */
    public SendResult send(long userId, String purpose, String email) {
        String target = email == null ? "" : email.trim();
        if (!isValidEmail(target)) {
            throw new IllegalArgumentException("邮箱格式不正确");
        }
        String key = key(userId, purpose, target);
        long now = System.currentTimeMillis();

        Code existing = store.get(key);
        int cooldown = Math.max(0, props.getResendCooldownSeconds());
        if (existing != null && cooldown > 0) {
            long elapsed = Duration.ofMillis(now - existing.sentAt).getSeconds();
            long wait = cooldown - elapsed;
            if (wait > 0) {
                throw new IllegalArgumentException("验证码发送过于频繁，请 " + wait + " 秒后重试");
            }
        }

        String code = nextCode();
        int ttl = Math.max(30, props.getCodeTtlSeconds());
        store.put(key, new Code(code, now + ttl * 1000L, now));
        purgeExpired(now);

        boolean mailSent = false;
        if (mailService.isConfigured()) {
            try {
                mailService.send(target, props.getSubject(), buildBody(code, ttl, target));
            } catch (MailService.MailSendException e) {
                // 发信失败：抹掉刚落库的验证码，否则用户只能干等重发冷却
                store.remove(key);
                throw e;
            }
            mailSent = true;
        } else if (props.isDevEchoCode()) {
            log.info("[开发模式] 未配置 SMTP，邮箱验证码仅写日志：user={} email={} purpose={} code={}",
                    userId, MailService.mask(target), purpose, code);
        } else {
            store.remove(key);
            throw new MailService.MailSendException("服务器未配置邮件服务，无法发送验证码");
        }
        return new SendResult(mailSent, mailSent ? null : code, ttl, cooldown, MailService.mask(target));
    }

    /**
     * 校验并消费验证码。
     *
     * @return true 表示通过（验证码同时作废）
     * @throws IllegalArgumentException 验证码已过期 / 错误（消息含剩余尝试次数）
     */
    public boolean verify(long userId, String purpose, String email, String code) {
        String target = email == null ? "" : email.trim();
        if (!isValidEmail(target)) {
            throw new IllegalArgumentException("邮箱格式不正确");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("请输入邮箱验证码");
        }
        String key = key(userId, purpose, target);
        Code entry = store.get(key);
        if (entry == null) {
            throw new IllegalArgumentException("请先获取邮箱验证码");
        }
        long now = System.currentTimeMillis();
        if (entry.expiresAt < now) {
            store.remove(key);
            throw new IllegalArgumentException("验证码已过期，请重新获取");
        }
        if (!entry.code.equals(code.trim())) {
            entry.attempts++;
            int max = Math.max(1, props.getMaxAttempts());
            if (entry.attempts >= max) {
                store.remove(key);
                throw new IllegalArgumentException("验证码错误次数过多，请重新获取");
            }
            throw new IllegalArgumentException("验证码不正确，还可尝试 " + (max - entry.attempts) + " 次");
        }
        store.remove(key);
        return true;
    }

    /** 主动作废某场景的验证码（如密码改完后清理）。 */
    public void invalidate(long userId, String purpose, String email) {
        if (email == null) {
            return;
        }
        store.remove(key(userId, purpose, email.trim()));
    }

    private String buildBody(String code, int ttl, String email) {
        return """
                你正在「小白学算法」为邮箱 %s 请求修改登录密码。

                验证码：%s

                有效期 %d 分钟。若这不是你本人的操作，请忽略本邮件，并尽快修改该邮箱的访问密码。
                """.formatted(MailService.mask(email), code, Math.max(1, ttl / 60));
    }

    private String nextCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private void purgeExpired(long now) {
        store.entrySet().removeIf(e -> e.getValue().expiresAt < now);
    }

    private static String key(long userId, String purpose, String email) {
        return userId + "|" + purpose + "|" + email.toLowerCase(Locale.ROOT);
    }

    /** 发送结果：mailSent=false 表示未接 SMTP 的开发模式（此时 devCode 为验证码明文）。 */
    public record SendResult(boolean mailSent, String devCode, int expiresInSeconds,
                            int cooldownSeconds, String maskedEmail) {
    }

    private static final class Code {
        private final String code;
        private final long expiresAt;
        private final long sentAt;
        private int attempts;

        private Code(String code, long expiresAt, long sentAt) {
            this.code = code;
            this.expiresAt = expiresAt;
            this.sentAt = sentAt;
        }
    }
}
