package com.suanfa.repository;

import com.suanfa.entity.MembershipPlan;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.util.List;
import java.util.Optional;

@Repository
public class MembershipPlanRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<MembershipPlan> MAPPER = (rs, i) -> new MembershipPlan(
            rs.getString("id"),
            rs.getString("name"),
            rs.getLong("price_cents"),
            nullableLong(rs, "original_price_cents"),
            rs.getInt("duration_days"),
            nullableString(rs, "description"),
            nullableString(rs, "features"),
            rs.getInt("sort_order"),
            rs.getInt("active") == 1);

    /** 兼容老库缺列的窗口期，避免 RowMapper 直接抛 SQLException。 */
    private static String nullableString(ResultSet rs, String col) {
        try {
            return rs.getString(col);
        } catch (Exception e) {
            return null;
        }
    }

    private static Long nullableLong(ResultSet rs, String col) {
        try {
            long v = rs.getLong(col);
            return rs.wasNull() ? null : v;
        } catch (Exception e) {
            return null;
        }
    }

    public MembershipPlanRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<MembershipPlan> findById(String id) {
        return jdbc.query("SELECT * FROM membership_plans WHERE id = ?", MAPPER, id)
                .stream().findFirst();
    }

    /** 上架中的套餐（展示顺序：sort_order 升序）。 */
    public List<MembershipPlan> findActive() {
        return jdbc.query("SELECT * FROM membership_plans WHERE active = 1 ORDER BY sort_order ASC, id ASC", MAPPER);
    }

    /** 全部套餐（含下架，管理端用）。 */
    public List<MembershipPlan> findAll() {
        return jdbc.query("SELECT * FROM membership_plans ORDER BY sort_order ASC, id ASC", MAPPER);
    }

    /** 种子导入：不存在才插入（管理员改过的配置不被启动覆盖）。返回是否新增。 */
    public boolean insertIfAbsent(MembershipPlan p) {
        return jdbc.update("""
                        INSERT INTO membership_plans (id, name, price_cents, original_price_cents, duration_days,
                                                      description, features, sort_order, active)
                        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
                        WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE id = ?)
                        """,
                p.id(), p.name(), p.priceCents(), p.originalPriceCents(), p.durationDays(),
                p.description(), p.featuresJson(), p.sortOrder(), p.active() ? 1 : 0,
                p.id()) > 0;
    }

    /** 管理端更新套餐（传 null 的字段不动）；featuresJson 传 null 表示不改。 */
    public int update(String id, String name, Long priceCents, Long originalPriceCents, Integer durationDays,
                      String description, String featuresJson, Integer sortOrder, Boolean active) {
        return jdbc.update("""
                        UPDATE membership_plans SET
                          name                  = ifnull(?, name),
                          price_cents           = ifnull(?, price_cents),
                          original_price_cents  = ifnull(?, original_price_cents),
                          duration_days         = ifnull(?, duration_days),
                          description           = ifnull(?, description),
                          features              = ifnull(?, features),
                          sort_order            = ifnull(?, sort_order),
                          active                = ifnull(?, active)
                        WHERE id = ?
                        """,
                name, priceCents, originalPriceCents, durationDays,
                description, featuresJson, sortOrder, active == null ? null : (active ? 1 : 0), id);
    }
}
