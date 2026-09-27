package com.suanfa.repository;

import com.suanfa.entity.PageNote;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

/** 页面笔记仓储：按「用户 × 页面路由路径」组织，一个页面上可有多条笔记（时间正序）。 */
@Repository
public class PageNoteRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<PageNote> MAPPER = (rs, i) -> new PageNote(
            rs.getLong("id"),
            rs.getString("page_path"),
            rs.getString("menu_path"),
            rs.getLong("user_id"),
            rs.getString("content"),
            rs.getString("creator"),
            rs.getString("created_at"));

    public PageNoteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 某用户在某页面上的全部笔记（创建时间正序）。 */
    public List<PageNote> findByUserAndPath(long userId, String pagePath) {
        return jdbc.query(
                "SELECT * FROM page_notes WHERE user_id = ? AND page_path = ? ORDER BY created_at ASC, id ASC",
                MAPPER, userId, pagePath);
    }

    /** 插入一条页面笔记，返回带自增 id 与创建时间的完整记录。 */
    public PageNote insert(long userId, String pagePath, String menuPath, String content, String creator) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO page_notes (page_path, menu_path, user_id, content, creator, created_at) "
                            + "VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, pagePath);
            ps.setString(2, menuPath);
            ps.setLong(3, userId);
            ps.setString(4, content);
            ps.setString(5, creator);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("page_notes insert failed: no generated key");
        }
        return findById(key.longValue())
                .orElseThrow(() -> new IllegalStateException("page_notes insert failed: row not found"));
    }

    public Optional<PageNote> findById(long id) {
        List<PageNote> rows = jdbc.query("SELECT * FROM page_notes WHERE id = ?", MAPPER, id);
        return rows.stream().findFirst();
    }

    /** 删除自己的笔记（user_id 双重限定，别人的删不动）。 */
    public void deleteByIdAndUser(long id, long userId) {
        jdbc.update("DELETE FROM page_notes WHERE id = ? AND user_id = ?", id, userId);
    }
}
