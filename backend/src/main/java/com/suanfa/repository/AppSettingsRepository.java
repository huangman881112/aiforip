package com.suanfa.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 应用级运行时配置（表 {@code app_settings}，key-value，value 存 JSON 文本）。
 *
 * <p>与 {@code application.yml} / 环境变量的关系：yml 是「出厂配置」，本表是「页面改出来的覆盖配置」，
 * 由具体 Service 决定合并顺序（AI 助教：本表优先，yml 兜底），好处是改完立即生效、不需要重启。
 */
@Repository
public class AppSettingsRepository {

    private final JdbcTemplate jdbc;

    public AppSettingsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<String> get(String key) {
        List<String> rows = jdbc.queryForList("SELECT value FROM app_settings WHERE key = ?", String.class, key);
        return rows.stream().findFirst();
    }

    /** upsert：SQLite 3.24+ 支持 ON CONFLICT。 */
    public void put(String key, String value) {
        jdbc.update("INSERT INTO app_settings (key, value) VALUES (?, ?) "
                + "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')", key, value);
    }

    public void delete(String key) {
        jdbc.update("DELETE FROM app_settings WHERE key = ?", key);
    }

    public Optional<String> updatedAt(String key) {
        List<String> rows = jdbc.queryForList("SELECT updated_at FROM app_settings WHERE key = ?", String.class, key);
        return rows.stream().findFirst();
    }
}
