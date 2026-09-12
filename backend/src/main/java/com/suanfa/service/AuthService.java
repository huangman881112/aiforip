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

    public AuthService(UserRepository repository, AdminGuard adminGuard) {
        this.repository = repository;
        this.adminGuard = adminGuard;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /** 注册：用户名已存在返回 null，否则创建并返回用户。 */
    public User register(String username, String rawPassword) {
        if (username == null || username.isBlank()
                || rawPassword == null || rawPassword.length() < 4) {
            throw new IllegalArgumentException("用户名不能为空且密码至少 4 位");
        }
        if (repository.findByUsername(username).isPresent()) {
            return null;
        }
        long id = repository.insert(username, passwordEncoder.encode(rawPassword), null, User.ROLE_USER);
        return repository.findById(id).orElse(null);
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

    public java.util.Optional<User> findById(long id) {
        return repository.findById(id);
    }

    public UserResponse toResponse(User u) {
        return new UserResponse(u.id(), u.username(), u.email(), u.createdAt(),
                u.role() == null ? User.ROLE_USER : u.role(), adminGuard.isAdmin(u));
    }
}
