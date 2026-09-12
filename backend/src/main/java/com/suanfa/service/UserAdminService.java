package com.suanfa.service;

import com.suanfa.dto.AdminUserDto;
import com.suanfa.entity.User;
import com.suanfa.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * 「用户管理」业务层（调用方 {@code UserAdminController} 已保证请求来自管理员）。
 *
 * <p>提供列表 / 新建 / 编辑（用户名、邮箱、角色）/ 重置密码 / 删除，并守住几条不能破的规矩：
 *
 * <ul>
 *   <li>不能删除或降级「当前登录的账号」，也不能删到全场只剩最后一个管理员 —— 否则没人能再进管理页；</li>
 *   <li>{@code suanfa.ai.admin-usernames} 白名单账号的角色不由页面控制（配置优先），
 *       因此也不能改名或删除，避免「配置身份」和「数据身份」互相打架；</li>
 *   <li>删除用户会连带清掉它的进度 / 笔记 / 评论 / 刷题记录（SQLite 连接默认不开外键级联，这里显式删）。</li>
 * </ul>
 */
@Service
public class UserAdminService {

    private static final Logger log = LoggerFactory.getLogger(UserAdminService.class);

    private static final Pattern USERNAME = Pattern.compile("^[\\w\\u4e00-\\u9fa5.-]{2,32}$");
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final int MIN_PASSWORD = 4;

    private final UserRepository userRepository;
    private final AdminGuard adminGuard;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserAdminService(UserRepository userRepository, AdminGuard adminGuard, JdbcTemplate jdbc) {
        this.userRepository = userRepository;
        this.adminGuard = adminGuard;
        this.jdbc = jdbc;
    }

    /** 列表（keyword 匹配用户名/邮箱，空则全部）。 */
    public AdminUserDto.ListResponse list(String keyword) {
        List<AdminUserDto.Row> rows = userRepository.findUsersWithStats(keyword).stream()
                .map(this::toRow)
                .toList();
        return new AdminUserDto.ListResponse(rows.size(), rows);
    }

    /** 新建用户；用户名已存在 / 参数不合法时抛 {@link IllegalArgumentException}（→ 400）。 */
    public AdminUserDto.Row create(AdminUserDto.CreateRequest req, Long actorId) {
        String username = requireUsername(req.username());
        String password = requirePassword(req.password(), "密码");
        String email = normalizeEmail(req.email(), null);
        String role = normalizeRole(req.role());
        if (adminGuard.inWhitelist(username)) {
            throw new IllegalArgumentException("用户名 " + username + " 与管理员白名单同名，请换一个");
        }
        if (userRepository.usernameTaken(username, null)) {
            throw new IllegalArgumentException("用户名 " + username + " 已存在");
        }
        long id = userRepository.insert(username, passwordEncoder.encode(password), email, role);
        User saved = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("创建用户失败"));
        log.info("管理员（id={}）创建用户：{}（id={}, role={}）", actorId, username, id, role);
        return toRow(saved);
    }

    /** 编辑用户名 / 邮箱 / 角色（请求里为 null 的字段表示不改动）。 */
    public AdminUserDto.Row update(long id, AdminUserDto.UpdateRequest req, Long actorId) {
        User target = mustExist(id);
        String username = target.username();
        String email = target.email();
        String role = roleOf(target);

        if (req.username() != null && !req.username().isBlank()) {
            String next = requireUsername(req.username());
            if (!next.equals(username)) {
                requireNotWhitelisted(target, "改名");
                if (userRepository.usernameTaken(next, null)) {
                    throw new IllegalArgumentException("用户名 " + next + " 已存在");
                }
                username = next;
            }
        }
        if (req.email() != null) {
            email = normalizeEmail(req.email(), id);
        }
        boolean roleChanged = false;
        if (req.role() != null && !req.role().isBlank()) {
            String next = normalizeRole(req.role());
            if (!next.equals(role)) {
                if (User.ROLE_USER.equals(next)) {
                    assertNotLastAdminGuarded(target, actorId, "降级");
                }
                roleChanged = true;
                role = next;
            }
        }

        if (!username.equals(target.username())) {
            userRepository.updateUsername(id, username);
        }
        // 只有请求里显式带了 email 字段才动邮箱（空串 = 解绑），null 表示「不改」
        if (req.email() != null && !Objects.equals(email, target.email())) {
            userRepository.updateEmail(id, email);
        }
        if (roleChanged) {
            userRepository.updateRole(id, role);
        }
        log.info("管理员（id={}）更新用户 id={}：username={} email={} role={}", actorId, id, username, email, role);
        return toRow(mustExist(id));
    }

    /** 管理员重置密码（不需要原密码与邮箱验证码）；不改动绑定邮箱。 */
    public void resetPassword(long id, AdminUserDto.PasswordRequest req, Long actorId) {
        User target = mustExist(id);
        String password = requirePassword(req.password(), "新密码");
        userRepository.updatePassword(id, passwordEncoder.encode(password), null);
        log.info("管理员（id={}）重置用户 {}（id={}）的密码", actorId, target.username(), id);
    }

    /** 删除用户并清理其学习数据。 */
    @Transactional
    public void delete(long id, Long actorId) {
        User target = mustExist(id);
        assertNotLastAdminGuarded(target, actorId, "删除");
        requireNotWhitelisted(target, "删除");
        // SQLite 连接默认不启用外键级联，这里显式清干净，避免留下孤儿数据
        int progress = jdbc.update("DELETE FROM progress WHERE user_id = ?", id);
        int notes = jdbc.update("DELETE FROM notes WHERE user_id = ?", id);
        int comments = jdbc.update("DELETE FROM comments WHERE user_id = ?", id);
        int training = jdbc.update("DELETE FROM training WHERE user_id = ?", id);
        userRepository.deleteById(id);
        log.info("管理员（id={}）删除用户 {}（id={}）：进度 {} 条、笔记 {} 条、评论 {} 条、刷题 {} 条",
                actorId, target.username(), id, progress, notes, comments, training);
    }

    // ------------------------------------------------------------ 内部工具

    private AdminUserDto.Row toRow(Map<String, Object> r) {
        String username = str(r.get("username"));
        String role = Optional.ofNullable(str(r.get("role"))).orElse(User.ROLE_USER);
        boolean whitelisted = adminGuard.inWhitelist(username);
        return new AdminUserDto.Row(
                num(r.get("id")),
                username,
                str(r.get("email")),
                role,
                User.ROLE_ADMIN.equalsIgnoreCase(role) || whitelisted,
                whitelisted,
                str(r.get("created_at")),
                num(r.get("progress_count")),
                num(r.get("note_count")),
                num(r.get("comment_count")),
                num(r.get("training_count")));
    }

    private AdminUserDto.Row toRow(User u) {
        boolean whitelisted = adminGuard.inWhitelist(u.username());
        return new AdminUserDto.Row(
                u.id(), u.username(), u.email(), roleOf(u),
                adminGuard.isAdmin(u), whitelisted, u.createdAt(), 0, 0, 0, 0);
    }

    private User mustExist(long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在（id=" + id + "），可能已被删除"));
    }

    /** 管理员账号的「删除 / 降级」保护：不许自杀、不许清零。普通用户直接放过。 */
    private void assertNotLastAdminGuarded(User target, Long actorId, String action) {
        if (!adminGuard.isAdmin(target)) {
            return;
        }
        if (actorId != null && actorId.equals(target.id())) {
            throw new IllegalArgumentException("不能" + action + "当前登录的账号，请用另一个管理员操作");
        }
        if (adminGuard.countAdmins() <= 1) {
            throw new IllegalArgumentException("至少需要保留一个管理员账号");
        }
    }

    private void requireNotWhitelisted(User target, String action) {
        if (adminGuard.inWhitelist(target.username())) {
            throw new IllegalArgumentException("白名单管理员账号（suanfa.ai.admin-usernames）不支持" + action
                    + "，如需调整请改配置");
        }
    }

    private String requireUsername(String raw) {
        String v = raw == null ? "" : raw.trim();
        if (!USERNAME.matcher(v).matches()) {
            throw new IllegalArgumentException("用户名需为 2-32 位字母、数字、下划线、点、横线或中文");
        }
        return v;
    }

    private String requirePassword(String raw, String label) {
        if (raw == null || raw.length() < MIN_PASSWORD) {
            throw new IllegalArgumentException(label + "至少 " + MIN_PASSWORD + " 位");
        }
        return raw;
    }

    /** email 传空串表示解绑；未传（null）由调用方处理为「不改」。 */
    private String normalizeEmail(String raw, Long excludeId) {
        if (raw == null) {
            return null;
        }
        String v = raw.trim();
        if (v.isEmpty()) {
            return null;
        }
        if (!EMAIL.matcher(v).matches()) {
            throw new IllegalArgumentException("邮箱格式不正确");
        }
        if (userRepository.emailTaken(v, excludeId)) {
            throw new IllegalArgumentException("该邮箱已被其他账号绑定");
        }
        return v;
    }

    private String normalizeRole(String raw) {
        String v = raw == null || raw.isBlank() ? User.ROLE_USER : raw.trim().toLowerCase(Locale.ROOT);
        if (!User.ROLE_ADMIN.equals(v) && !User.ROLE_USER.equals(v)) {
            throw new IllegalArgumentException("角色只能是 admin 或 user");
        }
        return v;
    }

    private static String roleOf(User u) {
        return u.role() == null || u.role().isBlank() ? User.ROLE_USER : u.role();
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static long num(Object o) {
        return o instanceof Number n ? n.longValue() : 0L;
    }
}
