package com.suanfa.config;

import com.suanfa.repository.UserRepository;
import com.suanfa.service.AlgorithmContentService;
import com.suanfa.service.AlgorithmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** 启动时执行：算法元数据种子导入（幂等）+ 默认账号创建（幂等）。 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    /** 默认登录账号（本地开发用；生产环境请通过环境变量覆盖或删除此种子逻辑） */
    public static final String DEFAULT_ADMIN_USERNAME = "admin";
    public static final String DEFAULT_ADMIN_PASSWORD = "admin123";

    private final AlgorithmService algorithmService;
    private final AlgorithmContentService algorithmContentService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AlgorithmService algorithmService, AlgorithmContentService algorithmContentService,
                           UserRepository userRepository) {
        this.algorithmService = algorithmService;
        this.algorithmContentService = algorithmContentService;
        this.userRepository = userRepository;
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
        seedDefaultAdmin();
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

    /** 幂等创建默认账号：用户名 admin / 密码 admin123。 */
    private void seedDefaultAdmin() {
        if (userRepository.findByUsername(DEFAULT_ADMIN_USERNAME).isPresent()) {
            log.info("默认账号 {} 已存在，跳过创建", DEFAULT_ADMIN_USERNAME);
            return;
        }
        userRepository.insert(DEFAULT_ADMIN_USERNAME, passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
        log.info("已创建默认账号：{} / {}", DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD);
    }
}
