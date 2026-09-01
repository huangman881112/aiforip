package com.suanfa.service;

import com.suanfa.dto.UserResponse;
import com.suanfa.entity.User;
import com.suanfa.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** 用户注册 / 登录校验。 */
@Service
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository repository) {
        this.repository = repository;
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
        long id = repository.insert(username, passwordEncoder.encode(rawPassword));
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

    public java.util.Optional<User> findById(long id) {
        return repository.findById(id);
    }

    public UserResponse toResponse(User u) {
        return new UserResponse(u.id(), u.username(), u.createdAt());
    }
}
