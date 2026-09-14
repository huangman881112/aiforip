package com.suanfa.service;

import java.util.regex.Pattern;

/**
 * 邮箱格式校验 / 规范化的唯一收口（注册、用户管理改邮箱、邮箱验证码共用同一套规则）。
 *
 * <p>规则：非空时长度 ≤ {@value #MAX_LENGTH} 字符，且匹配
 * {@code 本地部分@域名.顶级域}（顶级域至少 2 位字母）。邮箱在本站为选填项，
 * {@link #normalize} 把空串 / 纯空白统一成 null（= 未绑定），入库前务必走它。
 */
public final class Emails {

    public static final int MAX_LENGTH = 120;

    /**
     * 与主流邮箱服务商（QQ / 163 / Gmail / Outlook 等）兼容的宽格式：
     * 不苛求 RFC 5322 全集，但能拦住「缺少 @ / 缺少域名 / 顶级域过短 / 含非法字符」的常见输错。
     */
    public static final Pattern PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private Emails() {
    }

    /** 是否合法（null 安全；校验前先 trim）。 */
    public static boolean isValid(String email) {
        return email != null
                && email.trim().length() <= MAX_LENGTH
                && PATTERN.matcher(email.trim()).matches();
    }

    /** 规范化：trim；空串 / 纯空白 → null（表示未绑定邮箱）。 */
    public static String normalize(String email) {
        if (email == null) {
            return null;
        }
        String v = email.trim();
        return v.isEmpty() ? null : v;
    }

    /**
     * 校验不合法时抛 {@link IllegalArgumentException}（全局异常处理器统一转 400 + 提示文案）。
     *
     * @return 规范化（trim）后的邮箱；空串返回 null
     */
    public static String requireValid(String email) {
        String v = normalize(email);
        if (v == null) {
            return null;
        }
        if (v.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("邮箱过长（最多 " + MAX_LENGTH + " 位）");
        }
        if (!PATTERN.matcher(v).matches()) {
            throw new IllegalArgumentException("邮箱格式不正确，请检查后重试（示例：name@example.com）");
        }
        return v;
    }
}
