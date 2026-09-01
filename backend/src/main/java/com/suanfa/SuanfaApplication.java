package com.suanfa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
public class SuanfaApplication {

    public static void main(String[] args) throws IOException {
        // 确保 SQLite 数据目录存在（jdbc:sqlite:data/suanfa.db）
        Path dataDir = Path.of("data");
        if (!Files.exists(dataDir)) {
            Files.createDirectories(dataDir);
        }
        SpringApplication.run(SuanfaApplication.class, args);
    }
}
