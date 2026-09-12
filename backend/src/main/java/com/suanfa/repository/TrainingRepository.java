package com.suanfa.repository;

import com.suanfa.entity.Training;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class TrainingRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Training> MAPPER = (rs, i) -> new Training(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getString("problem_id"),
            rs.getString("status"),
            rs.getString("updated_at"));

    public TrainingRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Training> findByUserId(long userId) {
        return jdbc.query("SELECT * FROM training WHERE user_id = ? ORDER BY updated_at DESC",
                MAPPER, userId);
    }

    public Optional<Training> findByUserAndProblem(long userId, String problemId) {
        List<Training> rows = jdbc.query(
                "SELECT * FROM training WHERE user_id = ? AND problem_id = ?",
                MAPPER, userId, problemId);
        return rows.stream().findFirst();
    }

    /** 存在则更新 status + updated_at，否则插入。返回保存后的记录（时间用 localtime，与学习日历按天分组一致）。 */
    public Training upsert(long userId, String problemId, String status) {
        jdbc.update("""
                INSERT INTO training (user_id, problem_id, status, updated_at)
                VALUES (?, ?, ?, datetime('now','localtime'))
                ON CONFLICT (user_id, problem_id)
                DO UPDATE SET status = excluded.status, updated_at = datetime('now','localtime')
                """, userId, problemId, status);
        return findByUserAndProblem(userId, problemId)
                .orElseThrow(() -> new IllegalStateException("training upsert failed"));
    }

    public void deleteByUserAndProblem(long userId, String problemId) {
        jdbc.update("DELETE FROM training WHERE user_id = ? AND problem_id = ?", userId, problemId);
    }
}
