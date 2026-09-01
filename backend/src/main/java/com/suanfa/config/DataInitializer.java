package com.suanfa.config;

import com.suanfa.service.AlgorithmService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** 启动时执行：算法元数据种子导入（幂等）。 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final AlgorithmService algorithmService;

    public DataInitializer(AlgorithmService algorithmService) {
        this.algorithmService = algorithmService;
    }

    @Override
    public void run(String... args) {
        algorithmService.seedIfEmpty();
        log.info("算法元数据种子导入完成（共 {} 条）", algorithmService.list(null).size());
    }
}
