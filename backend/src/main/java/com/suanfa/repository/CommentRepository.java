package com.suanfa.repository;

import com.suanfa.entity.Comment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CommentRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Comment> MAPPER = (rs, i) -> new Comment(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getString("algorithm_id"),
            rs.getString("content"),
            rs.getString("created_at"));

    public CommentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 某算法的评论列表（时间正序，便于前端直接展示）。 */
    public List<Comment> findByAlgorithm(String algorithmId) {
        return jdbc.query(
                "SELECT * FROM comments WHERE algorithm_id = ? ORDER BY created_at ASC, id ASC",
                MAPPER, algorithmId);
    }

    public Optional<Comment> findById(long id) {
        List<Comment> rows = jdbc.query("SELECT * FROM comments WHERE id = ?", MAPPER, id);
        return rows.stream().findFirst();
    }

    /** 插入评论（created_at 用服务器本地时间，保证学习日历按天分组与用户感知一致）。 */
    public Comment insert(long userId, String algorithmId, String content) {
        jdbc.update("INSERT INTO comments (user_id, algorithm_id, content, created_at) "
                + "VALUES (?, ?, ?, datetime('now','localtime'))",
                userId, algorithmId, content);
        Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
        return findById(id)
                .orElseThrow(() -> new IllegalStateException("comments insert failed"));
    }

    /** 删除评论，返回是否删到了记录。 */
    public boolean deleteByIdAndUser(long id, long userId) {
        return jdbc.update("DELETE FROM comments WHERE id = ? AND user_id = ?", id, userId) > 0;
    }
}
