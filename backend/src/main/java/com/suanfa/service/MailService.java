package com.suanfa.service;

import com.suanfa.config.MailProperties;
import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Properties;

/**
 *  SMTP 发信：把邮箱验证码投递到用户邮箱。
 *
 * <p>{@code suanfa.mail.host} 为空即「未接入邮件服务」：{@link #isConfigured()} 返回 false，
 * 调用方（{@link EmailCodeService}）自行决定是降级为日志模式还是直接报错。
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final MailProperties props;

    public MailService(MailProperties props) {
        this.props = props;
    }

    /** 是否配置了可用的 SMTP（host 与发件人非空）。 */
    public boolean isConfigured() {
        return props.getHost() != null && !props.getHost().isBlank()
                && !props.resolvedFrom().isBlank();
    }

    /**
     * 发送纯文本邮件。
     *
     * @throws MailSendException 发信失败（连接不上 / 认证失败 / 收件人被拒）
     */
    public void send(String to, String subject, String body) {
        if (!isConfigured()) {
            throw new MailSendException("服务器未配置邮件服务（suanfa.mail.host 为空）");
        }
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(props.getHost().trim());
        sender.setPort(props.getPort());
        sender.setUsername(props.getUsername());
        sender.setPassword(props.getPassword());
        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        int timeoutMillis = Math.max(1, props.getTimeoutSeconds()) * 1000;
        Properties jp = sender.getJavaMailProperties();
        jp.put("mail.transport.protocol", "smtp");
        jp.put("mail.smtp.auth", "true");
        jp.put("mail.smtp.connectiontimeout", timeoutMillis);
        jp.put("mail.smtp.timeout", timeoutMillis);
        jp.put("mail.smtp.writetimeout", timeoutMillis);
        if (props.isSsl()) {
            jp.put("mail.smtp.ssl.enable", "true");
            // 信任服务商的自签 / STARTTLS 升级证书（QQ、163 等 465 端口需要）
            jp.put("mail.smtp.ssl.trust", "*");
        } else if (props.isStarttls()) {
            jp.put("mail.smtp.starttls.enable", "true");
        }

        try {
            MimeMessage message = sender.createMimeMessage();
            message.setFrom(new InternetAddress(props.resolvedFrom()));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
            message.setSubject(subject == null ? "" : subject, StandardCharsets.UTF_8.name());
            message.setText(body == null ? "" : body, StandardCharsets.UTF_8.name());
            sender.send(message);
            log.info("验证码邮件已投递：to={} subject={}", mask(to), subject);
        } catch (Exception e) {
            log.warn("验证码邮件发送失败：to={} host={} port={} err={}",
                    mask(to), sender.getHost(), sender.getPort(), e.toString());
            throw new MailSendException("邮件发送失败（SMTP 连接/认证异常），请检查邮箱地址或稍后重试", e);
        }
    }

    /** 邮箱脱敏（日志用）：ab***@qq.com。 */
    static String mask(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        String name = email.substring(0, at);
        String head = name.length() <= 2 ? name.substring(0, 1) : name.substring(0, 2);
        return head + "***" + email.substring(at);
    }

    /** 发信失败（区别于参数非法：调用方按 502 返回，提示可重试）。 */
    public static class MailSendException extends RuntimeException {
        public MailSendException(String message) {
            super(message);
        }

        public MailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
