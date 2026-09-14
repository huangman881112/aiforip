package com.suanfa.service;

import com.suanfa.dto.UserResponse;
import com.suanfa.entity.User;
import com.suanfa.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** 用户注册 / 登录校验 / 修改密码。 */
@Service
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AdminGuard adminGuard;
    private final EmailCodeService emailCodeService;

    public AuthService(UserRepository repository, AdminGuard adminGuard, EmailCodeService emailCodeService) {
        this.repository = repository;
        this.adminGuard = adminGuard;
        this.emailCodeService = emailCodeService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * 注册：用户名已存在 / 邮箱不合法或已被绑定 / 验证码不正确时抛 {@link IllegalArgumentException}（→ 400 + 提示）。
     *
     * <p>邮箱选填，但填了必须配合「注册邮箱验证码」验证邮箱真实性：格式（{@link Emails#requireValid}）
     * → 是否已被绑定 → 验证码校验；一次性验证码在所有廉价校验之后消费，低级错误不烧码。
     *
     * @param email 选填；空串 / 纯空白规一化为 null（不绑定，验证码也跳过）
     * @param code  注册验证码；仅在填了邮箱时必填
 */
    public User register(String username, String rawPassword, String email, String code) {
        if (username == null || username.isBlank()
                || rawPassword == null || rawPassword.length() < 4) {
            throw new IllegalArgumentException("用户名不能为空且密码至少 4 位");
        }
        if (repository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("用户名已存在");
        }
        String normalizedEmail = Emails.requireValid(email);
        if (normalizedEmail != null) {
            if (repository.emailTaken(normalizedEmail, null)) {
                throw new IllegalArgumentException("该邮箱已被其他账号绑定，请换一个或直接登录");
            }
            // 一次性验证码放最后消费：前面的廉价校验失败不烧码（与改密流程同一原则）
            emailCodeService.verify(null, EmailCodeService.PURPOSE_REGISTER, normalizedEmail, code);
        }
        long id = repository.insert(username, passwordEncoder.encode(rawPassword), normalizedEmail, User.ROLE_USER);
        return repository.findById(id).orElse(null);
    }

    /** 兼容旧调用（不带邮箱）：等价于 email / code 为 null。 */
    public User register(String username, String rawPassword) {
        return register(username, rawPassword, null, null);
    }

    /** 邮箱是否已被其他账号绑定（注册发码前提前拦，不给已注册邮箱发码）。 */
    public boolean isEmailBound(String email) {
        String v = Emails.normalize(email);
        return v != null && repository.emailTaken(v, null);
    }

    /** 登录：校验用户名 + 密码。 */
    public User login(String username, String rawPassword) {
        if (username == null || username.isBlank() || rawPassword == null) {
            return null;
        }
        return repository.findByUsername(username)
                .filter(u -> passwordEncoder.matches(rawPassword, u.passwordHash()))
                .orElse(null);
    }

    /**
     * 修改密码第一步：先校验原密码与新密码规则。
     *
     * <p>必须在验验证码之前跑：否则“原密码写错”这种低级失误也会把一次性验证码消费掉，
     * 用户得重新等 60s 重发。
     *
     * @throws IllegalArgumentException 原密码不正确 / 新密码不合规则 / 与新密码相同
     */
    public void validatePasswordChange(User user, String rawOldPassword, String rawNewPassword) {
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        if (rawOldPassword == null || !passwordEncoder.matches(rawOldPassword, user.passwordHash())) {
            throw new IllegalArgumentException("原密码不正确");
        }
        if (rawNewPassword == null || rawNewPassword.length() < 6) {
            throw new IllegalArgumentException("新密码至少 6 位");
        }
        if (rawNewPassword.equals(rawOldPassword)) {
            throw new IllegalArgumentException("新密码不能与原密码相同");
        }
    }

    /**
     * 修改密码第二步（验证码校验通过后调用）：更新密码，并把已验证的邮箱绑定到账号。
     *
     * <p>未绑定过则写入；已绑定则换成本次验证通过的新邮箱。
     */
    public User applyPasswordChange(long userId, String rawNewPassword, String verifiedEmail) {
        String email = verifiedEmail == null || verifiedEmail.isBlank() ? null : verifiedEmail.trim();
        repository.updatePassword(userId, passwordEncoder.encode(rawNewPassword), email);
        User user = repository.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        return user;
    }

    /**
     * 修改邮箱第一步：先校当前登录密码（防会话被冒用后静默换绑）。
     *
     * <p>必须在验验证码之前跑：否则「密码写错」这种低级失误也会把一次性验证码消费掉，
     * 用户得重新等冷却重发（与改密流程同一原则）。
     */
    public void validateEmailChange(User user, String rawPassword) {
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        if (rawPassword == null || !passwordEncoder.matches(rawPassword, user.passwordHash())) {
            throw new IllegalArgumentException("当前密码不正确");
        }
    }

    /**
     * 修改邮箱第二步（验证码校验通过后调用）：把已验证的新邮箱绑定到账号。
     *
     * <p>提交时再查一次占用：发码与提交之间邮箱可能被别人抢先绑定（TOCTOU），
     * 命中则要求换邮箱并重新获取验证码（旧验证码与新邮箱一一对应，不能复用）。
     */
    public User applyEmailChange(long userId, String verifiedEmail) {
        String email = Emails.requireValid(verifiedEmail);
        if (repository.emailTaken(email, userId)) {
            throw new IllegalArgumentException("该邮箱已被其他账号绑定，请换一个邮箱并重新获取验证码");
        }
        repository.updateEmail(userId, email);
        User user = repository.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        return user;
    }

    public java.util.Optional<User> findById(long id) {
        return repository.findById(id);
    }

    public UserResponse toResponse(User u) {
        String expireAt = u.membershipExpireAt();
        String displayName = u.displayName() == null || u.displayName().isBlank()
                ? u.username() : u.displayName();
        return new UserResponse(u.id(), u.username(), displayName, u.email(), u.createdAt(),
                u.role() == null ? User.ROLE_USER : u.role(), adminGuard.isAdmin(u),
                OrderService.isMemberActive(expireAt), expireAt);
    }
}
