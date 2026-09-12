package com.suanfa.service;

import com.suanfa.config.AiProperties;
import com.suanfa.entity.User;
import com.suanfa.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * 管理员判定，两条来源任一命中即为管理员：
 *
 * <ol>
 *   <li>{@code users.role = 'admin'}：由管理员在「用户管理」界面授予（可在页面上增删）；</li>
 *   <li>{@code suanfa.ai.admin-usernames} 白名单（默认 admin）：配置级兜底，
 *       防止把最后一个管理员降级 / 改了角色后把自己锁在门外，也便于冷启动首个账号。</li>
 * </ol>
 *
 * <p>AI 中转站配置、「用户管理」入口、「个人中心 → 修改密码」入口是否展示，都以这里为准。
 */
@Service
public class AdminGuard {

    private final AiProperties props;
    private final UserRepository userRepository;

    public AdminGuard(AiProperties props, UserRepository userRepository) {
        this.props = props;
        this.userRepository = userRepository;
    }

    public List<String> adminUsernames() {
        List<String> out = new ArrayList<>();
        for (String s : String.valueOf(props.getAdminUsernames()).split(",")) {
            String v = s.trim().toLowerCase(Locale.ROOT);
            if (!v.isEmpty()) {
                out.add(v);
            }
        }
        return out;
    }

    /** 用户名是否在配置白名单里（这层身份不由页面角色控制）。 */
    public boolean inWhitelist(String username) {
        List<String> admins = adminUsernames();
        return username != null && !admins.isEmpty()
                && admins.contains(username.trim().toLowerCase(Locale.ROOT));
    }

    /** 实体级判定：页面角色 admin 或命中白名单。 */
    public boolean isAdmin(User user) {
        if (user == null) {
            return false;
        }
        return user.isAdminRole() || inWhitelist(user.username());
    }

    public boolean isAdmin(Long userId) {
        if (userId == null) {
            return false;
        }
        return userRepository.findById(userId).map(this::isAdmin).orElse(false);
    }

    /** 当前管理员总数（页面角色 + 白名单去重），用于「别把最后一个管理员删掉/降级」的保护。 */
    public int countAdmins() {
        return (int) userRepository.findAll().stream().filter(this::isAdmin).count();
    }
}
