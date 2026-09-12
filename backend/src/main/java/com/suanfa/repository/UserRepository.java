package com.suanfa.repository;

import com.suanfa.entity.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<User> MAPPER = (rs, i) -> new User(
            rs.getLong("id"),
            rs.getString("username"),
            rs.getString("password_hash"),
            nullableString(rs, "email"),
            rs.getString("created_at"),
            nullableString(rs, "role"));

    /** 兼容尚未迁移 email / role 列的旧库（迁移在 DataInitializer 里做）。 */
    private static String nullableString(ResultSet rs, String column) {
        try {
            return rs.getString(column);
        } catch (Exception e) {
            return null;
        }
    }

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByUsername(String username) {
        List<User> rows = jdbc.query("SELECT * FROM users WHERE username = ?", MAPPER, username);
        return rows.stream().findFirst();
    }

    public Optional<User> findById(long id) {
        List<User> rows = jdbc.query("SELECT * FROM users WHERE id = ?", MAPPER, id);
        return rows.stream().findFirst();
    }

    /** 全部用户（id 升序），仅内部逻辑使用（如管理员判定的白名单兜底）。 */
    public List<User> findAll() {
        return jdbc.query("SELECT * FROM users ORDER BY id ASC", MAPPER);
    }

    public long insert(String username, String passwordHash) {
        return insert(username, passwordHash, null, User.ROLE_USER);
    }

    public long insert(String username, String passwordHash, String email) {
        return insert(username, passwordHash, email, User.ROLE_USER);
    }

    /** 创建用户，返回自增 id（email 可为 null；role 传 null 视为 user）。 */
    public long insert(String username, String passwordHash, String email, String role) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, username);
            ps.setString(2, passwordHash);
            ps.setString(3, email == null || email.isBlank() ? null : email.trim());
            ps.setString(4, User.ROLE_ADMIN.equalsIgnoreCase(role) ? User.ROLE_ADMIN : User.ROLE_USER);
            return ps;
        }, kh);
        Number key = kh.getKey();
        return key == null ? -1 : key.longValue();
    }

    /** 更新密码哈希（同时可刷新绑定邮箱；email 传 null 表示不动）。 */
    public int updatePassword(long id, String passwordHash, String email) {
        if (email == null) {
            return jdbc.update("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, id);
        }
        return jdbc.update("UPDATE users SET password_hash = ?, email = ? WHERE id = ?",
                passwordHash, email.trim(), id);
    }

    /** 绑定 / 更新邮箱；传 null 或空串都表示解绑。 */
    public int updateEmail(long id, String email) {
        return jdbc.update("UPDATE users SET email = ? WHERE id = ?",
                email == null || email.isBlank() ? null : email.trim(), id);
    }

    /** 改名（用户名唯一性由调用方校验）。 */
    public int updateUsername(long id, String username) {
        return jdbc.update("UPDATE users SET username = ? WHERE id = ?", username.trim(), id);
    }

    /** 设定角色（只接受 admin / user，其余按 user 处理）。 */
    public int updateRole(long id, String role) {
        return jdbc.update("UPDATE users SET role = ? WHERE id = ?",
                User.ROLE_ADMIN.equalsIgnoreCase(role) ? User.ROLE_ADMIN : User.ROLE_USER, id);
    }

    /** 用户名是否被占用（excludeId 用于改名时排除自己，传 null 表示不排除）。 */
    public boolean usernameTaken(String username, Long excludeId) {
        if (excludeId == null) {
            return !jdbc.queryForList("SELECT id FROM users WHERE username = ? LIMIT 1", Long.class, username).isEmpty();
        }
        return !jdbc.queryForList("SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1",
                Long.class, username, excludeId).isEmpty();
    }

    /** 邮箱是否已被别的账号绑定（excludeId 用于改自己资料时排除自己）。 */
    public boolean emailTaken(String email, Long excludeId) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String sql = excludeId == null
                ? "SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1"
                : "SELECT id FROM users WHERE lower(email) = lower(?) AND id <> ? LIMIT 1";
        List<Long> ids = excludeId == null
                ? jdbc.queryForList(sql, Long.class, email.trim())
                : jdbc.queryForList(sql, Long.class, email.trim(), excludeId);
        return !ids.isEmpty();
    }

    /**
     * 「用户管理」列表：用户信息 + 各自的学习数据量（一次查询带出，避免 N+1）。
     *
     * <p>keyword 为空则返回全部；匹配用户名或邮箱（不区分大小写）。列名为下划线风格，由 service 转 DTO。
     */
    public List<Map<String, Object>> findUsersWithStats(String keyword) {
        String like = keyword == null || keyword.isBlank()
                ? null
                : "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
        if (like == null) {
            return jdbc.queryForList(STATS_SQL);
        }
        // WHERE 必须拼在 ORDER BY 之前，因此这里不复用 STATS_SQL 而是重建尾部
        return jdbc.queryForList(STATS_HEAD + """
                 WHERE lower(u.username) LIKE ? OR lower(ifnull(u.email, '')) LIKE ?
                 ORDER BY u.id ASC
                """, like, like);
    }

    private static final String STATS_HEAD = """
            SELECT u.id, u.username, u.email, u.role, u.created_at,
                   (SELECT COUNT(*) FROM progress  p WHERE p.user_id  = u.id) AS progress_count,
                   (SELECT COUNT(*) FROM notes     n WHERE n.user_id  = u.id) AS note_count,
                   (SELECT COUNT(*) FROM comments  c WHERE c.user_id  = u.id) AS comment_count,
                   (SELECT COUNT(*) FROM training  t WHERE t.user_id  = u.id) AS training_count
              FROM users u
            """;

    private static final String STATS_SQL = STATS_HEAD + " ORDER BY u.id ASC";

    /** 删除用户（返回受影响行数）。关联数据的清理由调用方负责。 */
    public int deleteById(long id) {
        return jdbc.update("DELETE FROM users WHERE id = ?", id);
    }
}
