package com.suanfa.service;

import com.suanfa.config.PaymentProperties;
import com.suanfa.dto.MembershipDtos.CreateOrderRequest;
import com.suanfa.dto.MembershipDtos.CreateOrderResponse;
import com.suanfa.dto.MembershipDtos.DailyPoint;
import com.suanfa.dto.MembershipDtos.OrderListResponse;
import com.suanfa.dto.MembershipDtos.OrderView;
import com.suanfa.dto.MembershipDtos.PlanView;
import com.suanfa.dto.MembershipDtos.PlansResponse;
import com.suanfa.dto.MembershipDtos;
import com.suanfa.dto.MembershipDtos.StatsResponse;
import com.suanfa.dto.MembershipDtos.StatusView;
import com.suanfa.dto.MembershipDtos.UpdatePlanRequest;
import com.suanfa.entity.MembershipPlan;
import com.suanfa.entity.Order;
import com.suanfa.entity.User;
import com.suanfa.repository.MembershipPlanRepository;
import com.suanfa.repository.OrderRepository;
import com.suanfa.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 会员 + 订单核心业务：套餐展示 / 下单 / 取消 / 支付成功激活会员 / 管理端列表与统计。
 *
 * <p>关键约定：
 * <ul>
 *   <li>时间一律 UTC 'YYYY-MM-DD HH:MM:SS'（与 SQLite datetime('now') 一致，同宽定长可直接字符串比较）；</li>
 *   <li>金额一律「分」（long），换算与展示由前端负责；</li>
 *   <li>订单保存套餐快照（名称 / 金额 / 天数），后台调价不影响历史订单；</li>
 *   <li>支付成功激活会员 = max(now, 现有到期时间) + 订单天数，续费顺延不清零；
 *       退款仅标记订单，不回收已生效会员（页面已向用户说明）；</li>
 *   <li>markPaid 幂等：重复回调 / 重复点击直接返回当前订单。</li>
 * </ul>
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    /** 会员权益：AI 助教每分钟提问上限倍数（普通用户 1 倍）。 */
    public static final int MEMBER_RATE_MULTIPLIER = 3;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int MY_ORDERS_LIMIT = 50;

    private final MembershipPlanRepository planRepo;
    private final OrderRepository orderRepo;
    private final UserRepository userRepo;
    private final PaymentService paymentService;
    private final PaymentProperties paymentProps;
    private final ObjectMapper mapper = new ObjectMapper();

    public OrderService(MembershipPlanRepository planRepo, OrderRepository orderRepo,
                        UserRepository userRepo, PaymentService paymentService, PaymentProperties paymentProps) {
        this.planRepo = planRepo;
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
        this.paymentService = paymentService;
        this.paymentProps = paymentProps;
    }

    // ------------------------------------------------------------ 套餐

    /** 上架套餐（公开接口：未登录也能看价格表）。 */
    public PlansResponse activePlans() {
        List<PlanView> plans = planRepo.findActive().stream().map(this::toPlanView).toList();
        return new PlansResponse(plans, paymentProps.isSandbox());
    }

    /** 全部套餐（含下架，管理端）。 */
    public List<PlanView> allPlans() {
        return planRepo.findAll().stream().map(this::toPlanView).toList();
    }

    /** 管理端改套餐（null 字段不动；features 传数组，空数组 = 清空）。 */
    public PlanView updatePlan(String id, UpdatePlanRequest req) {
        MembershipPlan plan = planRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("套餐不存在：" + id));
        if (req.name() != null && req.name().isBlank()) {
            throw new IllegalArgumentException("套餐名称不能为空");
        }
        if (req.priceCents() != null && req.priceCents() < 0) {
            throw new IllegalArgumentException("价格不能为负数");
        }
        if (req.durationDays() != null && req.durationDays() <= 0) {
            throw new IllegalArgumentException("时长必须大于 0 天");
        }
        String featuresJson = req.features() == null ? null : toJson(req.features());
        planRepo.update(id, req.name(), req.priceCents(), req.originalPriceCents(), req.durationDays(),
                req.description(), featuresJson, req.sortOrder(), req.active());
        log.info("管理员更新套餐 {}：{} -> price={}d duration={}d active={}",
                id, plan.name(), req.priceCents(), req.durationDays(), req.active());
        return toPlanView(planRepo.findById(id).orElse(plan));
    }

    // ------------------------------------------------------------ 用户端

    /** 当前用户会员状态（未登录不会调到这里，Controller 已拦 401）。 */
    public StatusView status(long userId) {
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        boolean active = isMemberActive(u.membershipExpireAt());
        return new StatusView(active, u.membershipExpireAt(),
                active ? daysLeft(u.membershipExpireAt()) : 0, rateMultiplier(userId));
    }

    /** 下单：生成订单号，pending 状态，{@code order-expire-minutes} 分钟后过期。 */
    public CreateOrderResponse createOrder(long userId, CreateOrderRequest req) {
        MembershipPlan plan = planRepo.findById(req == null || req.planId() == null ? "" : req.planId().trim())
                .orElseThrow(() -> new IllegalArgumentException("套餐不存在，请刷新页面后重试"));
        if (!plan.active()) {
            throw new IllegalArgumentException("该套餐已下架，请选择其他套餐");
        }
        String channel = PaymentService.normalizeChannel(req == null ? null : req.channel());
        if (channel == null) {
            throw new IllegalArgumentException("不支持的支付渠道");
        }
        if (PaymentService.CHANNEL_MOCK.equals(channel) && !paymentProps.isSandbox()) {
            throw new IllegalArgumentException("模拟支付仅在沙箱环境开放");
        }
        expireStale(); // 下单前顺手清一遍超时单，避免旧单占着「待支付」
        Order order = new Order(null, generateOrderNo(), userId, plan.id(), plan.name(),
                plan.priceCents(), Order.STATUS_PENDING, channel, null, null, null,
                plan.durationDays(), null);
        orderRepo.insert(order, paymentProps.getOrderExpireMinutes());
        Order saved = orderRepo.findByOrderNo(order.orderNo()).orElse(order);
        log.info("用户 {} 下单：{}（{}，{} 分，{} 渠道）", userId, saved.orderNo(), plan.name(),
                plan.priceCents(), channel);
        return new CreateOrderResponse(toView(saved, usernameOf(saved.userId())),
                paymentProps.isSandbox(), paymentProps.getOrderExpireMinutes() * 60L);
    }

    /** 我的订单（最新 50 条）。 */
    public OrderListResponse myOrders(long userId) {
        expireStale();
        List<OrderView> views = orderRepo.listByUser(userId, MY_ORDERS_LIMIT).stream()
                .map(o -> toView(o, usernameOf(userId)))
                .toList();
        return new OrderListResponse(views.size(), views);
    }

    /** 单条订单（用户只能看自己的；管理员可看全部）。 */
    public OrderView orderOf(String orderNo, Long userId, boolean admin) {
        expireStale();
        Order o = mustExist(orderNo);
        if (!admin && (userId == null || !o.userId().equals(userId))) {
            throw new IllegalArgumentException("无权查看该订单");
        }
        return toView(o, usernameOf(o.userId()));
    }

    /** 取消订单（仅本人 + 仅待支付）。 */
    public OrderView cancel(String orderNo, long userId) {
        Order o = mustExist(orderNo);
        if (!o.userId().equals(userId)) {
            throw new IllegalArgumentException("无权操作该订单");
        }
        if (!o.isPending()) {
            throw new IllegalArgumentException("订单当前状态不可取消（" + statusText(o.status()) + "）");
        }
        orderRepo.updateStatus(orderNo, Order.STATUS_CANCELLED, null, null, null);
        log.info("用户 {} 取消订单 {}", userId, orderNo);
        return toView(mustExist(orderNo), usernameOf(userId));
    }

    // ------------------------------------------------------------ 支付

    /**
     * 标记已支付并激活会员（幂等）。沙箱 mock 支付 / 网关回调 / 管理员手工确认都收口到这里。
     *
     * @param byAdmin 管理员手工确认（沙箱之外也允许，用于线下转账对账）
     */
    @Transactional
    public OrderView markPaid(String orderNo, String channel, String tradeNo, boolean byAdmin, Long actorId) {
        Order o = mustExist(orderNo);
        if (Order.STATUS_PAID.equals(o.status())) {
            return toView(o, usernameOf(o.userId())); // 幂等：重复回调直接返回
        }
        if (!o.isPending()) {
            throw new IllegalArgumentException("订单当前状态不可支付（" + statusText(o.status()) + "）");
        }
        // 仍在校验期内才算有效支付（回调迟到 / 手工确认补漏的场景）
        if (o.expiresAt() != null && o.expiresAt().compareTo(utcNow()) < 0) {
            orderRepo.updateStatus(orderNo, Order.STATUS_EXPIRED, null, null, null);
            throw new IllegalArgumentException("订单已超时未支付（expires_at=" + o.expiresAt() + "），请重新下单");
        }
        String paidAt = utcNow();
        String ch = channel == null || channel.isBlank() ? o.payChannel() : channel;
        String no = tradeNo == null || tradeNo.isBlank() ? generateTradeNo() : tradeNo;
        orderRepo.updateStatus(orderNo, Order.STATUS_PAID, paidAt, ch, no);

        // 激活会员：未过期则在原到期时间上顺延，已过期 / 首开从现在起算
        User u = userRepo.findById(o.userId()).orElseThrow(
                () -> new IllegalArgumentException("订单所属用户不存在（id=" + o.userId() + "）"));
        String base = o.userId() != null && isMemberActive(u.membershipExpireAt())
                ? u.membershipExpireAt() : utcNow();
        String newExpire = FMT.format(LocalDateTime.parse(base, FMT).plusDays(o.membershipDays()));
        userRepo.updateMembershipExpire(o.userId(), newExpire);
        log.info("订单 {} 支付成功（{}，{} 分，by {}）：用户 {} 会员顺延至 {}",
                orderNo, o.planName(), o.amountCents(), byAdmin ? "管理员" : "支付回调",
                u.username(), newExpire);
        return toView(mustExist(orderNo), u.username());
    }

    /** 退款（仅已支付订单可退；不回收已生效会员，页面与管理端都有说明）。 */
    @Transactional
    public OrderView refund(String orderNo, long actorId) {
        Order o = mustExist(orderNo);
        if (!Order.STATUS_PAID.equals(o.status())) {
            throw new IllegalArgumentException("仅已支付的订单可以退款（当前：" + statusText(o.status()) + "）");
        }
        orderRepo.updateStatus(orderNo, Order.STATUS_REFUNDED, null, null, null);
        log.info("管理员 {} 将订单 {} 标记为退款（{} 分）", actorId, orderNo, o.amountCents());
        return toView(mustExist(orderNo), usernameOf(o.userId()));
    }

    // ------------------------------------------------------------ 管理端

    /** 订单列表（keyword 匹配订单号 / 用户名；status 过滤；分页）。 */
    public OrderListResponse adminList(String keyword, String status, int page, int size) {
        expireStale();
        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 1);
        String st = status == null || status.isBlank() ? null : status.trim().toLowerCase(Locale.ROOT);
        List<OrderView> rows = orderRepo.adminList(keyword, st, safeSize, (safePage - 1) * safeSize).stream()
                .map(this::toAdminView)
                .toList();
        return new OrderListResponse(orderRepo.adminCount(keyword, st), rows);
    }

    /** 营收统计：各状态聚合 + 最近 7 日成交（缺数据的天补零，保证日期连续）。 */
    public StatsResponse stats() {
        expireStale();
        Map<String, Map<String, Long>> agg = orderRepo.statusAggregates();
        long revenue = agg.getOrDefault(Order.STATUS_PAID, Map.of()).getOrDefault("amount", 0L);
        long paid = agg.getOrDefault(Order.STATUS_PAID, Map.of()).getOrDefault("count", 0L);
        long pending = agg.getOrDefault(Order.STATUS_PENDING, Map.of()).getOrDefault("count", 0L);
        long cancelled = agg.getOrDefault(Order.STATUS_CANCELLED, Map.of()).getOrDefault("count", 0L);
        long expired = agg.getOrDefault(Order.STATUS_EXPIRED, Map.of()).getOrDefault("count", 0L);
        long refunded = agg.getOrDefault(Order.STATUS_REFUNDED, Map.of()).getOrDefault("count", 0L);

        Map<String, long[]> daily = new java.util.LinkedHashMap<>();
        for (Map<String, Object> r : orderRepo.paidDaily(7)) {
            String d = String.valueOf(r.get("d"));
            daily.put(d, new long[]{((Number) r.get("cnt")).longValue(), ((Number) r.get("amt")).longValue()});
        }
        List<DailyPoint> last7 = new ArrayList<>();
        LocalDateTime today = LocalDateTime.now(ZoneOffset.UTC);
        for (int i = 6; i >= 0; i--) {
            String d = today.minusDays(i).toLocalDate().toString();
            long[] v = daily.getOrDefault(d, new long[]{0, 0});
            last7.add(new DailyPoint(d, v[0], v[1]));
        }
        return new StatsResponse(revenue, paid, pending, cancelled, expired, refunded,
                orderRepo.countAll(), last7);
    }

    // ------------------------------------------------------------ 会员判定

    /** 是否有效会员（到期时间字符串与当前 UTC 字符串直接比较，同宽定长安全）。 */
    public boolean isMember(Long userId) {
        if (userId == null) {
            return false;
        }
        return userRepo.findById(userId).map(u -> isMemberActive(u.membershipExpireAt())).orElse(false);
    }

    /** AI 助教限流倍数：会员 3 倍，其余 1 倍（未登录 1 倍）。 */
    public int rateMultiplier(Long userId) {
        return isMember(userId) ? MEMBER_RATE_MULTIPLIER : 1;
    }

    /** 到期时间是否在当前之后（null / 格式异常一律视为未开通）。 */
    public static boolean isMemberActive(String expireAt) {
        return expireAt != null && !expireAt.isBlank() && expireAt.compareTo(utcNow()) > 0;
    }

    // ------------------------------------------------------------ 内部工具

    /** 把超时未付的 pending 订单置为 expired（读路径顺手执行，幂等）。 */
    private void expireStale() {
        try {
            orderRepo.expireStale();
        } catch (Exception e) {
            log.warn("清理超时订单失败（忽略）: {}", e.getMessage());
        }
    }

    private OrderView toView(Order o, String username) {
        return new OrderView(o.orderNo(), username, o.planId(), o.planName(), o.amountCents(), o.status(),
                o.payChannel(), o.tradeNo(), o.paidAt(), o.expiresAt(), o.createdAt(), o.membershipDays(),
                o.isPending() ? paymentService.payUrl(o.orderNo(), o.payChannel(), o.amountCents()) : null);
    }

    /** 管理端列表行（原始 SQL 行：orders.* + username）。 */
    @SuppressWarnings("unchecked")
    private OrderView toAdminView(Map<String, Object> r) {
        Order o = new Order(((Number) r.get("id")).longValue(), (String) r.get("order_no"),
                ((Number) r.get("user_id")).longValue(), (String) r.get("plan_id"), (String) r.get("plan_name"),
                ((Number) r.get("amount_cents")).longValue(), (String) r.get("status"),
                (String) r.get("pay_channel"), (String) r.get("trade_no"), (String) r.get("paid_at"),
                (String) r.get("expires_at"), ((Number) r.get("membership_days")).intValue(),
                (String) r.get("created_at"));
        return toView(o, (String) r.get("username"));
    }

    private PlanView toPlanView(MembershipPlan p) {
        Long monthlyAvg = p.durationDays() >= 28
                ? Math.round(p.priceCents() * 30.0 / p.durationDays()) : null;
        return new PlanView(p.id(), p.name(), p.priceCents(), p.originalPriceCents(), p.durationDays(),
                p.description(), MembershipDtos.featuresOf(p.featuresJson()), p.sortOrder(), p.active(),
                monthlyAvg);
    }

    /** 订单号：SF + UTC yyMMddHHmmss + 4 位随机（唯一约束冲突时由调用方重试，碰撞概率极低）。 */
    private String generateOrderNo() {
        String ts = LocalDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
        return "SF" + ts + ThreadLocalRandom.current().nextInt(1000, 10000);
    }

    private String generateTradeNo() {
        return "MOCK" + LocalDateTime.now(ZoneOffset.UTC)
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }

    private Order mustExist(String orderNo) {
        return orderRepo.findByOrderNo(orderNo)
                .orElseThrow(() -> new IllegalArgumentException("订单不存在：" + orderNo));
    }

    private String usernameOf(Long userId) {
        return userId == null ? null : userRepo.findById(userId).map(User::username).orElse(null);
    }

    private static long daysLeft(String expireAt) {
        try {
            return java.time.Duration.between(
                    LocalDateTime.now(ZoneOffset.UTC), LocalDateTime.parse(expireAt, FMT)).toDays();
        } catch (Exception e) {
            return 0;
        }
    }

    private static String utcNow() {
        return FMT.format(LocalDateTime.now(ZoneOffset.UTC));
    }

    /** 状态的中文展示（管理端 / 报错信息用）。 */
    public static String statusText(String status) {
        return switch (status == null ? "" : status) {
            case Order.STATUS_PENDING -> "待支付";
            case Order.STATUS_PAID -> "已支付";
            case Order.STATUS_CANCELLED -> "已取消";
            case Order.STATUS_EXPIRED -> "已过期";
            case Order.STATUS_REFUNDED -> "已退款";
            default -> status;
        };
    }

    private String toJson(List<String> features) {
        try {
            return mapper.writeValueAsString(features);
        } catch (Exception e) {
            return "[]";
        }
    }
}
