package com.suanfa.repository;

import com.suanfa.entity.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Order> MAPPER = (rs, i) -> new Order(
            rs.getLong("id"),
            rs.getString("order_no"),
            rs.getLong("user_id"),
            rs.getString("plan_id"),
            rs.getString("plan_name"),
            rs.getLong("amount_cents"),
            rs.getString("status"),
            rs.getString("pay_channel"),
            nullableString(rs, "trade_no"),
            nullableString(rs, "paid_at"),
            rs.getString("expires_at"),
            rs.getInt("membership_days"),
            rs.getString("created_at"));

    private static String nullableString(ResultSet rs, String col) {
        try {
            return rs.getString(col);
        } catch (Exception e) {
            return null;
        }
    }

    public OrderRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long insert(Order o, int expireMinutes) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                    INSERT INTO orders (order_no, user_id, plan_id, plan_name, amount_cents, status,
                                        pay_channel, expires_at, membership_days)
                    VALUES (?, ?, ?, ?, ?, 'pending', ?, datetime('now', ?), ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, o.orderNo());
            ps.setLong(2, o.userId());
            ps.setString(3, o.planId());
            ps.setString(4, o.planName());
            ps.setLong(5, o.amountCents());
            ps.setString(6, o.payChannel());
            ps.setString(7, "+" + expireMinutes + " minutes");
            ps.setInt(8, o.membershipDays());
            return ps;
        }, kh);
        Number key = kh.getKey();
        return key == null ? -1 : key.longValue();
    }

    public Optional<Order> findByOrderNo(String orderNo) {
        return jdbc.query("SELECT * FROM orders WHERE order_no = ?", MAPPER, orderNo)
                .stream().findFirst();
    }

    /** 当前用户的订单（最新在前）。 */
    public List<Order> listByUser(long userId, int limit) {
        return jdbc.query("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT ?", MAPPER, userId, limit);
    }

    /** 把超时未付的 pending 订单批量置为 expired，返回受影响行数（列表/详情读取前顺手执行）。 */
    public int expireStale() {
        return jdbc.update("""
                UPDATE orders SET status = 'expired'
                 WHERE status = 'pending' AND expires_at <= datetime('now')
                """);
    }

    /** 支付成功 / 取消 / 退款等状态迁移（paid 时才写 paidAt / 渠道 / 流水号，其余传 null 保持原值）。 */
    public int updateStatus(String orderNo, String status, String paidAt, String channel, String tradeNo) {
        return jdbc.update("""
                UPDATE orders SET status = ?,
                       paid_at = ifnull(?, paid_at),
                       pay_channel = ifnull(?, pay_channel),
                       trade_no = ifnull(?, trade_no)
                 WHERE order_no = ?
                """, status, paidAt, channel, tradeNo, orderNo);
    }

    /** 按状态聚合：status → {count, amountCents}（营收统计用）。 */
    public Map<String, Map<String, Long>> statusAggregates() {
        Map<String, Map<String, Long>> out = new java.util.LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT status, COUNT(*) AS cnt, IFNULL(SUM(amount_cents), 0) AS amt FROM orders GROUP BY status")) {
            String status = String.valueOf(r.get("status"));
            out.put(status, Map.of(
                    "count", ((Number) r.get("cnt")).longValue(),
                    "amount", ((Number) r.get("amt")).longValue()));
        }
        return out;
    }

    /** 已支付订单总数（全站）。 */
    public long countAll() {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM orders", Long.class);
        return n == null ? 0 : n;
    }

    /** 最近 N 天（按 UTC 自然日）每天的成交笔数与金额；缺数据的天由调用方补零。 */
    public List<Map<String, Object>> paidDaily(int days) {
        return jdbc.queryForList("""
                SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS cnt, IFNULL(SUM(amount_cents), 0) AS amt
                  FROM orders
                 WHERE status = 'paid' AND substr(created_at, 1, 10) >= date('now', ?)
                 GROUP BY d ORDER BY d ASC
                """, "-" + (days - 1) + " days");
    }

    /**
     * 管理端订单列表（JOIN users 带出用户名）：keyword 匹配订单号 / 用户名，status 为空则全部。
     * 返回原始行（orders.* + username），由 service 转 DTO。
     */
    public List<Map<String, Object>> adminList(String keyword, String status, int limit, int offset) {
        StringBuilder where = new StringBuilder();
        List<Object> args = new ArrayList<>();
        appendWhere(where, args, keyword, status);
        args.add(limit);
        args.add(offset);
        return jdbc.queryForList(ADMIN_HEAD + where + " ORDER BY o.id DESC LIMIT ? OFFSET ?", args.toArray());
    }

    public long adminCount(String keyword, String status) {
        StringBuilder where = new StringBuilder();
        List<Object> args = new ArrayList<>();
        appendWhere(where, args, keyword, status);
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM orders o JOIN users u ON u.id = o.user_id" + where,
                Long.class, args.toArray());
        return n == null ? 0 : n;
    }

    /** 管理端单条（带用户名）。 */
    public Optional<Map<String, Object>> adminFind(String orderNo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                ADMIN_HEAD + " WHERE o.order_no = ?", orderNo);
        return rows.stream().findFirst();
    }

    private static final String ADMIN_HEAD = """
            SELECT o.*, u.username FROM orders o JOIN users u ON u.id = o.user_id
            """;

    private static void appendWhere(StringBuilder where, List<Object> args, String keyword, String status) {
        if (keyword != null && !keyword.isBlank()) {
            where.append(where.isEmpty() ? " WHERE " : " AND ")
                    .append("(o.order_no LIKE ? OR u.username LIKE ?)");
            String like = "%" + keyword.trim() + "%";
            args.add(like);
            args.add(like);
        }
        if (status != null && !status.isBlank()) {
            where.append(where.isEmpty() ? " WHERE " : " AND ").append("o.status = ?");
            args.add(status);
        }
    }
}
