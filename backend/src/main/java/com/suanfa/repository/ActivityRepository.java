package com.suanfa.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * 学习活跃记录（学习日历数据源）：
 * 不建单独的事件表，从 progress / notes / comments / training 四张表的时间戳联合派生，
 * 同一天的多次行为按条数累计。
 */
@Repository
public class ActivityRepository {

    private static final String ACTIVITY_SQL = """
            SELECT d AS date, COUNT(*) AS count FROM (
                SELECT date(updated_at)  AS d FROM progress  WHERE user_id = ?
                UNION ALL
                SELECT date(updated_at)  AS d FROM notes     WHERE user_id = ?
                UNION ALL
                SELECT date(created_at)  AS d FROM comments  WHERE user_id = ?
                UNION ALL
                SELECT date(updated_at)  AS d FROM training  WHERE user_id = ?
            ) GROUP BY d ORDER BY d
            """;

    private final JdbcTemplate jdbc;

    public ActivityRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 用户全部学习活跃日：[{date: 'YYYY-MM-DD', count: n}, ...]（按日期升序）。 */
    public List<Map<String, Object>> findActivityByUserId(long userId) {
        return jdbc.queryForList(ACTIVITY_SQL, userId, userId, userId, userId);
    }
}
