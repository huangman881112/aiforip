package com.suanfa.repository;

import com.suanfa.entity.Algorithm;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class AlgorithmRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Algorithm> MAPPER = (rs, i) -> new Algorithm(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("category"),
            rs.getString("sub_category"),
            rs.getString("difficulty"),
            rs.getString("stability"),
            rs.getString("description"),
            rs.getString("complexity"),
            rs.getString("route"),
            rs.getString("complexity_details"));

    public AlgorithmRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Algorithm> findAll() {
        return jdbc.query("SELECT * FROM algorithms ORDER BY category, id", MAPPER);
    }

    public List<Algorithm> findByCategory(String category) {
        return jdbc.query("SELECT * FROM algorithms WHERE category = ? ORDER BY id", MAPPER, category);
    }

    public Optional<Algorithm> findById(String id) {
        List<Algorithm> rows = jdbc.query("SELECT * FROM algorithms WHERE id = ?", MAPPER, id);
        return rows.stream().findFirst();
    }

    public void insert(Algorithm a) {
        jdbc.update("""
                INSERT INTO algorithms (id, name, category, sub_category, difficulty, stability,
                                        description, complexity, route, complexity_details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                a.id(), a.name(), a.category(), a.subCategory(), a.difficulty(), a.stability(),
                a.description(), a.complexity(), a.route(), a.complexityDetails());
    }

    public long count() {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM algorithms", Long.class);
        return n == null ? 0 : n;
    }
}
