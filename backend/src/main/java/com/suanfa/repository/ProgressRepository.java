package com.suanfa.repository;

import com.suanfa.entity.Progress;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ProgressRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Progress> MAPPER = (rs, i) -> new Progress(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getString("algorithm_id"),
            rs.getString("status"),
            rs.getString("updated_at"));

    public ProgressRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Progress> findByUserId(long userId) {
        return jdbc.query("SELECT * FROM progress WHERE user_id = ? ORDER BY updated_at DESC",
                MAPPER, userId);
    }

    public Optional<Progress> findByUserAndAlgorithm(long userId, String algorithmId) {
        List<Progress> rows = jdbc.query(
                "SELECT * FROM progress WHERE user_id = ? AND algorithm_id = ?",
                MAPPER, userId, algorithmId);
        return rows.stream().findFirst();
    }

    /** 存在则更新 status + updated_at，否则插入。返回保存后的记录。 */
    public Progress upsert(long userId, String algorithmId, String status) {
        jdbc.update("""
                INSERT INTO progress (user_id, algorithm_id, status)
                VALUES (?, ?, ?)
                ON CONFLICT (user_id, algorithm_id)
                DO UPDATE SET status = excluded.status, updated_at = datetime('now')
                """, userId, algorithmId, status);
        return findByUserAndAlgorithm(userId, algorithmId)
                .orElseThrow(() -> new IllegalStateException("progress upsert failed"));
    }
}
