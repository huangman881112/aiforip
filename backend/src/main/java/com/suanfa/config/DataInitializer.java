package com.suanfa.config;

import com.suanfa.entity.MembershipPlan;
import com.suanfa.entity.User;
import com.suanfa.repository.UserRepository;
import com.suanfa.service.AlgorithmContentService;
import com.suanfa.service.AlgorithmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** 启动时执行：算法元数据种子导入（幂等）+ 轻量列迁移 + 默认账号与会员套餐创建（幂等）。 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    /** 默认登录账号（本地开发用；生产环境请通过环境变量覆盖或删除此种子逻辑） */
    public static final String DEFAULT_ADMIN_USERNAME = "admin";
    public static final String DEFAULT_ADMIN_PASSWORD = "admin123";

    private final AlgorithmService algorithmService;
    private final AlgorithmContentService algorithmContentService;
    private final UserRepository userRepository;
    private final com.suanfa.repository.MembershipPlanRepository planRepository;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AlgorithmService algorithmService, AlgorithmContentService algorithmContentService,
                           UserRepository userRepository, com.suanfa.repository.MembershipPlanRepository planRepository,
                           JdbcTemplate jdbc) {
        this.algorithmService = algorithmService;
        this.algorithmContentService = algorithmContentService;
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.jdbc = jdbc;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public void run(String... args) {
        int added = algorithmService.seedMissing();
        if (added > 0) {
            log.info("算法元数据补齐 {} 条（现共 {} 条）", added, algorithmService.list(null).size());
        } else {
            log.info("算法元数据已是最新（共 {} 条）", algorithmService.list(null).size());
        }
        seedAlgorithmContent();
        migrateUserEmailColumn();
        migrateUserRoleColumn();
        migrateUserMembershipColumn();
        migrateProfileColumns();
        seedDefaultAdmin();
        seedMembershipPlans();
    }

    /** 幂等导入 MongoDB 算法内容种子；Mongo 不可用时降级跳过（前端回退本地数据）。 */
    private void seedAlgorithmContent() {
        try {
            int addedContent = algorithmContentService.seedMissing();
            log.info("算法内容种子导入完成（新增 {} 条，现共 {} 条）", addedContent, algorithmContentService.count());
        } catch (Exception e) {
            log.warn("MongoDB 不可用，跳过算法内容种子导入：{}", e.getMessage());
        }
    }

    /**
     * 老库补 users.email 列（schema.sql 的 CREATE TABLE IF NOT EXISTS 不会给已存在的表加列）。
     * SQLite 的 ALTER TABLE ADD COLUMN 无 IF NOT EXISTS，列已存在时按异常吞掉即可。
     */
    private void migrateUserEmailColumn() {
        try {
            jdbc.execute("ALTER TABLE users ADD COLUMN email TEXT");
            log.info("users 表已补充 email 列");
        } catch (Exception e) {
            log.debug("users.email 列已存在，跳过迁移：{}", e.getMessage());
        }
    }

    /**
     * 老库补 users.role 列（新库由 schema.sql 建好）。
     *
     * <p>补完把已有账号按白名单回填一次角色，让「用户管理」页面显示的身份和实际权限一致；
     * 白名单账号（默认 admin）的 admin 身份本来就由配置兜底，回填只是让它不再显示成 user。
     */
    private void migrateUserRoleColumn() {
        try {
            jdbc.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
            log.info("users 表已补充 role 列");
        } catch (Exception e) {
            log.debug("users.role 列已存在，跳过迁移：{}", e.getMessage());
        }
    }

    /** 老库补 users.membership_expire_at 列（会员到期时间，新库由 schema.sql 建好）。 */
    private void migrateUserMembershipColumn() {
        try {
            jdbc.execute("ALTER TABLE users ADD COLUMN membership_expire_at TEXT");
            log.info("users 表已补充 membership_expire_at 列");
        } catch (Exception e) {
            log.debug("users.membership_expire_at 列已存在，跳过迁移：{}", e.getMessage());
        }
    }

    /**
     * 老库补个人中心资料列（display_name / gender / age / city / occupation / learning_goal，
     * 新库由 schema.sql 建好）。SQLite 的 ADD COLUMN 无 IF NOT EXISTS，列已存在时按异常吞掉。
     */
    private void migrateProfileColumns() {
        for (String ddl : new String[] {
                "ALTER TABLE users ADD COLUMN display_name TEXT",
                "ALTER TABLE users ADD COLUMN gender TEXT",
                "ALTER TABLE users ADD COLUMN age INTEGER",
                "ALTER TABLE users ADD COLUMN city TEXT",
                "ALTER TABLE users ADD COLUMN occupation TEXT",
                "ALTER TABLE users ADD COLUMN learning_goal TEXT"}) {
            try {
                jdbc.execute(ddl);
                log.info("users 表已补充列：{}", ddl.replace("ALTER TABLE users ADD COLUMN ", ""));
            } catch (Exception e) {
                log.debug("列已存在，跳过：{}", ddl);
            }
        }
    }

    /** 幂等导入会员套餐种子（价格单位为分）；管理员改过的配置不被启动覆盖。 */
    private void seedMembershipPlans() {
        try {
            boolean added = false;
            added |= planRepository.insertIfAbsent(new MembershipPlan(
                    "monthly", "月度会员", 1800, 2500L, 30,
                    "适合短期集中冲刺", features("AI 助教提问额度 3 倍", "全站算法可视化无限回放", "专属会员标识"),
                    1, true));
            added |= planRepository.insertIfAbsent(new MembershipPlan(
                    "quarterly", "季度会员", 4800, 7500L, 90,
                    "最受欢迎的进阶选择", features("AI 助教提问额度 3 倍", "全站算法可视化无限回放",
                    "专属会员标识", "刷题进度云端同步"),
                    2, true));
            added |= planRepository.insertIfAbsent(new MembershipPlan(
                    "yearly", "年度会员", 15800, 30000L, 365,
                    "全年畅学，折合每月约 13 元", features("AI 助教提问额度 3 倍", "全站算法可视化无限回放",
                    "专属会员标识", "刷题进度云端同步", "新功能优先体验"),
                    3, true));
            if (added) {
                log.info("会员套餐种子导入完成（共 {} 个上架套餐）", planRepository.findActive().size());
            }
        } catch (Exception e) {
            log.warn("会员套餐种子导入失败（忽略）：{}", e.getMessage());
        }
    }

    private static String features(String... items) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(items);
        } catch (Exception e) {
            return "[]";
        }
    }

    /** 幂等创建默认账号：用户名 admin / 密码 admin123（角色 admin）。 */
    private void seedDefaultAdmin() {
        var existing = userRepository.findByUsername(DEFAULT_ADMIN_USERNAME);
        if (existing.isPresent()) {
            if (!existing.get().isAdminRole()) {
                userRepository.updateRole(existing.get().id(), User.ROLE_ADMIN);
                log.info("默认账号 {} 角色已校正为 admin", DEFAULT_ADMIN_USERNAME);
            }
            log.info("默认账号 {} 已存在，跳过创建", DEFAULT_ADMIN_USERNAME);
            return;
        }
        userRepository.insert(DEFAULT_ADMIN_USERNAME, passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD),
                null, User.ROLE_ADMIN);
        log.info("已创建默认账号：{} / {}", DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD);
    }
}
