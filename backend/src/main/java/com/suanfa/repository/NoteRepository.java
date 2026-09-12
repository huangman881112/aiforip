package com.suanfa.repository;

import com.suanfa.entity.Note;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class NoteRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Note> MAPPER = (rs, i) -> new Note(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getString("algorithm_id"),
            rs.getString("content"),
            rs.getString("updated_at"));

    public NoteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Note> findByUserAndAlgorithm(long userId, String algorithmId) {
        List<Note> rows = jdbc.query(
                "SELECT * FROM notes WHERE user_id = ? AND algorithm_id = ?",
                MAPPER, userId, algorithmId);
        return rows.stream().findFirst();
    }

    /** 存在则更新 content + updated_at，否则插入。返回保存后的记录（时间用 localtime，与学习日历按天分组一致）。 */
    public Note upsert(long userId, String algorithmId, String content) {
        jdbc.update("""
                INSERT INTO notes (user_id, algorithm_id, content, updated_at)
                VALUES (?, ?, ?, datetime('now','localtime'))
                ON CONFLICT (user_id, algorithm_id)
                DO UPDATE SET content = excluded.content, updated_at = datetime('now','localtime')
                """, userId, algorithmId, content);
        return findByUserAndAlgorithm(userId, algorithmId)
                .orElseThrow(() -> new IllegalStateException("notes upsert failed"));
    }

    public void deleteByUserAndAlgorithm(long userId, String algorithmId) {
        jdbc.update("DELETE FROM notes WHERE user_id = ? AND algorithm_id = ?", userId, algorithmId);
    }
}
