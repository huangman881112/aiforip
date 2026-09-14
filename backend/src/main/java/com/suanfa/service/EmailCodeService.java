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
    /** 用途：注册时验证邮箱真实性（未登录，key 只按邮箱维度）。 */
    public static final String PURPOSE_REGISTER = "register";
    /** 用途：修改绑定邮箱（需登录，验证码发往要绑定的新邮箱）。 */
    public static final String PURPOSE_CHANGE_EMAIL = "change-email";

    private static final int CODE_LENGTH = 6;

    private final MailService mailService;
    private final MailProperties props;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Code> store = new ConcurrentHashMap<>();

    public EmailCodeService(MailService mailService, MailProperties props) {
        this.mailService = mailService;
        this.props = props;
    }

    /** 邮箱格式校验（规则收口在 {@link Emails}，与注册 / 用户管理共用同一套）。 */
    public static boolean isValidEmail(String email) {
        return Emails.isValid(email);
    }

    /**
     * 发送验证码。
     *
     * @param userId  当前登录用户；注册场景传 null（key 按邮箱维度，冷却照常生效）
     * @param purpose 用途（见 {@code PURPOSE_*}）
     * @param email   收件邮箱
     * @return 发送结果（是否真实发信、开发模式下回传的验证码）
     * @throws IllegalArgumentException 邮箱格式非法 / 重发过于频繁
     * @throws MailService.MailSendException SMTP 已配置但发送失败
     */
    public SendResult send(Long userId, String purpose, String email) {
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
                mailService.send(target, props.getSubject(), buildBody(code, ttl, target, purpose));
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
     * 校验并消费验证码（一次性：正确即作废）。
     *
     * @return true 表示通过
     * @throws IllegalArgumentException 验证码已过期 / 错误（消息含剩余尝试次数）
     */
    public boolean verify(Long userId, String purpose, String email, String code) {
        Code entry = requireValidCode(userId, purpose, email, code);
        store.remove(key(userId, purpose, email == null ? "" : email.trim()));
        return entry != null;
    }

    /**
     * 校验但不消费（注册页「输完 6 位即时反馈」的预检）。
     *
     * <p>与 {@link #verify} 同一套规则：错误仍计入尝试次数（防爆破），
     * 正确不删除 —— 正式注册时再由 {@code verify} 消费，避免预检通过后换码/重用。
     *
     * @return true 表示正确（未过期且未被尝试次数上限锁死）
     */
    public boolean check(Long userId, String purpose, String email, String code) {
        requireValidCode(userId, purpose, email, code);
        return true;
    }

    /** 校验验证码的公共路径：格式 → 存在 → 未过期 → 匹配（错误计入尝试次数）。失败抛异常。 */
    private Code requireValidCode(Long userId, String purpose, String email, String code) {
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
        return entry;
    }

    /** 主动作废某场景的验证码（如密码改完后清理）。 */
    public void invalidate(long userId, String purpose, String email) {
        if (email == null) {
            return;
        }
        store.remove(key(userId, purpose, email.trim()));
    }

    private String buildBody(String code, int ttl, String email, String purpose) {
        String scene;
        if (PURPOSE_REGISTER.equals(purpose)) {
            scene = "你正在「小白学算法」注册新账号，并验证该邮箱的真实性。";
        } else if (PURPOSE_CHANGE_EMAIL.equals(purpose)) {
            scene = "你正在「小白学算法」将账号邮箱换绑为 " + MailService.mask(email) + "，请确认该邮箱属于你本人。";
        } else {
            scene = "你正在「小白学算法」为邮箱 " + MailService.mask(email) + " 请求修改登录密码。";
        }
        return scene
                + "\n\n验证码：" + code
                + "\n\n有效期 " + Math.max(1, ttl / 60)
                + " 分钟。若这不是你本人的操作，请忽略本邮件。\n";
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

    private static String key(Long userId, String purpose, String email) {
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
